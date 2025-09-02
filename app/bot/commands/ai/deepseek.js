import { Command } from '../../../utils/command.js';
import Together from 'together-ai';

Command({
  name: 'ai-deepseek',
  description: 'DeepSeek R1',
  alias: ['deepseek', 'aids'],
  tags : {
    label : 'ai'
  },
  run: async ({ m }) => {
    const body = m.content.textWithoutCommand.trim();

    if (!body) return m.reply(__('cmd.ai.deepseek.ex', { command: m.content.command }));

    const together = new Together({
      apiKey: process.env.TOGETHER_API_KEY,
    });

    const completion = await together.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free',
      messages: [
        {
          role: 'user',
          content: body
        }
      ],
    });
    
    m.reply(completion.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim());
  }
});