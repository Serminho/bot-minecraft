const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { status } = require('minecraft-server-util');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.TOKEN;
const IP_SERVIDOR = 'allenmc.enxada.host';
const PORTA = 25565;
const canalStatusId = '1391858985342075011';

let mensagemId = null;

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
      const mensagem = await canal.send({ embeds: [embed] });
      mensagemId = mensagem.id;
    }
  } catch (err) {
    const canal = await client.channels.fetch(canalStatusId);

    const embedOffline = new EmbedBuilder()
      .setTitle('🔴 Servidor Offline ou Inacessível!')
      .setColor('#FF0000')
      .setDescription('Não foi possível conectar ao servidor Minecraft.')
      .setTimestamp()
      .setFooter({ text: 'Última tentativa' });

    if (mensagemId) {
      try {
        const mensagem = await canal.messages.fetch(mensagemId);
        await mensagem.edit({ embeds: [embedOffline] });
      } catch {
        const mensagem = await canal.send({ embeds: [embedOffline] });
        mensagemId = mensagem.id;
      }
    } else {
      const mensagem = await canal.send({ embeds: [embedOffline] });
      mensagemId = mensagem.id;
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  atualizarStatus();
  setInterval(atualizarStatus, 5 * 60 * 1000);
});

client.login(TOKEN);
