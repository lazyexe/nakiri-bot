import { Command } from '../../../utils/command.js';
import NotesInstance from '../../../utils/notes.js';
import * as luxon from 'luxon';

Command({
  name: 'tools-notes',
  description: 'Manage Notes',
  alias: ['note', 'create-note', 'delete-note', 'edit-note', 'list-notes'],
  tags : {
    label : 'tools'
  },
  run: async ({ m }) => {
    const actions = ['create', 'delete', 'edit', 'list'];
    const actionOrCode = m.content.textWithoutCommand.split('\n')[0].trim();

    const lines = m.content.textWithoutCommand.trim().split('\n');
    const data = {};
    let currentKey = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const match = line.match(/^([^:]+):\s*(.*)$/);

      if (match) {
        currentKey = match[1].trim();
        data[currentKey] = match[2].trim();
      } else {
        if (currentKey) {
          data[currentKey] += '\n' + line;
        }
      }
    }

    switch (actionOrCode.split(' ')[0].toLowerCase()) {
    case 'create':
      try {
        if (!data?.title || !data?.content) throw new Error(__('cmd.tools.notes.create.ex', { command: m.content.command }));
        const code = await NotesInstance.generateCode();
        const note = await NotesInstance.create({
          title: data.title,
          content: data.content,
          code,
          authorJid: m.senderJid,
          options: {
            password: data?.password
          }
        });

        m.reply(__('cmd.tools.notes.create.success', { code: note.code, command: m.content.command }));
      } catch (error) {
        m.reply(error.message);
      }
      break;
    case 'list':
      try {
        const page = actionOrCode.split(' ')[1];
        const action = actionOrCode.split(' ')[0].toLowerCase();
        let sortBy = 'createdAt';
        let sortOrder = 'desc';
        const notes = await NotesInstance.getPaginated({ page, sortBy, sortOrder });
        // if (notes.notes.length == 0) return m.reply(__('cmd.tools.notes.notFound', { command: m.content.command }));
        let text = '';
        for (const note of notes.notes) {
          text += `\`${note.code}\` - ${note.title}\n`;
        }
        text += `\n> Pages: ${notes.paginationPages.join(' ')}`;
        if (notes.currentPage < notes.paginationPages.length) {
          text += `\n> Next page - ${m.content.command} ${action} ${parseInt(notes.currentPage) + 1}`;
        }
        if (notes.currentPage > 1) {
          text += `\n> Previous page - ${m.content.command} ${action} ${parseInt(notes.currentPage) - 1}`;
        }
        m.reply(text);
      } catch (error) {
        m.reply(error.message);
      }
      break;
    case 'delete':
      try {
        const code = actionOrCode.split(' ')[1]?.trim();
        if (!code) throw new Error(__('cmd.tools.notes.delete.ex', { command: m.content.command }));
        await NotesInstance.delete(code);
        m.reply(__('cmd.tools.notes.delete.success'));
      } catch (error) {
        m.reply(error.message);
      }
      break;
    default:
      let code = actionOrCode.split(' ')[0]?.trim();
      let password = actionOrCode.split(' ')[1]?.trim();
      console.log(code, password);
      if (code == '') return m.reply(__('cmd.tools.notes.ex', { command: m.content.command }));
      const note = await NotesInstance.getByCode(code);
      if (!note) return m.reply(__('cmd.tools.notes.notFound'));
      if (note.password) {
        if (password == '' || !password) return m.reply(__('cmd.tools.notes.requirePassword', { command: m.content.command }));
        if (note.password !== password) return m.reply(__('cmd.tools.notes.wrongPassword', { command: m.content.command }));
      }
      let text = note.content + '\n\n';
      // text += `> Author ${note.author.pushName}\n`;
      text += `> Created at ${luxon.DateTime.fromJSDate(new Date(note.createdAt)).toRelative()}`;
      m.reply(text);
      break;
    }
  }
});