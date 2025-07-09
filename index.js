// Servidor Web para manter o bot ativo no Render
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot está online! 👾');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor web rodando na porta ${PORT}`);
});

// Bot Discord
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { status } = require('minecraft-server-util');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const IP_SERVIDOR = 'allenmc.enxada.host';
const PORTA = 25565;
const canalStatusId = '1391858985342075011';

let mensagemId = null;

// Função que atualiza o status do servidor Minecraft
async function atualizarStatus() {
  try {
    const resposta = await status(IP_SERVIDOR, PORTA);
    const canal = await client.channels.fetch(canalStatusId);

    const embed = new EmbedBuilder()
      .setTitle('🟢 Servidor Minecraft Online!')
      .setColor('#00FF00')
      .addFields(
        { name: 'Jogadores Online', value: `${resposta.players.online} / ${resposta.players.max}`, inline: true },
        { name: 'Versão', value: resposta.version.name, inline: true },
        { name: 'Descrição', value: resposta.motd.clean || resposta.motd.raw || 'Sem descrição' }
      )
      .setTimestamp()
      .setFooter({ text: 'Última atualização' });

    if (mensagemId) {
      const mensagem = await canal.messages.fetch(mensagemId);
      await mensagem.edit({ embeds: [embed] });
    } else {
      console.log('Nenhuma mensagem existente para editar (online). Ignorando envio.');
    }
  } catch (err) {
    console.error('Servidor offline ou inacessível:', err);

    try {
      const canal = await client.channels.fetch(canalStatusId);

      const embedOffline = new EmbedBuilder()
        .setTitle('🔴 Servidor Offline ou Inacessível!')
        .setColor('#FF0000')
        .setDescription('Não foi possível conectar ao servidor Minecraft.')
        .setTimestamp()
        .setFooter({ text: 'Última tentativa' });

      if (mensagemId) {
        const mensagem = await canal.messages.fetch(mensagemId);
        await mensagem.edit({ embeds: [embedOffline] });
      } else {
        console.log('Nenhuma mensagem existente para editar (offline). Ignorando envio.');
      }
    } catch (e) {
      console.error('Erro ao editar mensagem offline:', e);
    }
  }
}

// Evento quando o bot está pronto
client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  try {
    const canal = await client.channels.fetch(canalStatusId);
    const mensagens = await canal.messages.fetch({ limit: 10 });
    const mensagemBot = mensagens.find(msg => msg.author.id === client.user.id);
    if (mensagemBot) {
      mensagemId = mensagemBot.id;
      console.log(`📌 Mensagem antiga localizada: ${mensagemId}`);
    } else {
      console.log('⚠️ Nenhuma mensagem anterior do bot encontrada.');
    }
  } catch (err) {
    console.error('Erro ao buscar mensagem antiga:', err);
  }

  atualizarStatus();
  setInterval(atualizarStatus, 5 * 60 * 1000); // Atualiza a cada 5 minutos
});

client.login(TOKEN);
