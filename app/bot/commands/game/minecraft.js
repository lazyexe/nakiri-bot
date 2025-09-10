import { Command } from '../../../utils/command.js';
import { Client } from 'exaroton';

Command({
  name: 'game-minecraft',
  description: 'Minecraft Server',
  alias: ['minecraft', 'mc'],
  tags: { label: 'game' },
  run: async ({ sock, m }) => {
    const client = new Client(process.env.EXAROTON_TOKEN);
    let server  = await client.server(process.env.EXAROTON_SERVER_ID);
    await server.get();

    let text = '*❖ Minecraft Survial Server*';
    text += '\n▷ IP Java : ' + '`underworld.ilsya.my.id`';
    text += '\n▷ IP Bedrock : ' + 'Coming Soon';
    text += '\n\n';
    text += '*❖ Software Server*';
    text += '\n▷ Name : ' + server.software.name;
    text += '\n▷ Version : ' + server.software.version;
    text += '\n\n';
    text += '*❖ Player Online (' + server.players.count + ' / ' + server.players.max + ')*';

    for (const player of server.players.list) {
      text += '\n▷ ' + player;
    }

    await m.reply(text);
  }
});