import { prisma } from './prisma.js';

class Notes {
  async create({
    title,
    content,
    code,
    authorJid,
    options
  }) {
    return await prisma.note.create({
      data: {
        title,
        content,
        code,
        authorJid,
        password: options?.password || null
      }
    });
  }

  async getByCode(code) {
    return await prisma.note.findUnique({
      where: { code },
      include: {
        author: true
      }
    });
  }

  async getPaginated({
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = '',
    page = 1,
    limit = 10
  }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    where.password = null;

    const [notes, totalNotes] = await prisma.$transaction([
      prisma.note.findMany({
        skip,
        take: limit,
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
      }),
      prisma.note.count({ where }),
    ]);

    const totalPages = Math.ceil(totalNotes / limit);

    const paginationPages = this.#getPaginationPages({
      currentPage: page,
      totalPages,
      maxPages: 7
    });

    return {
      notes,
      totalItems: totalNotes,
      totalPages,
      currentPage: page,
      limit,
      paginationPages,
      search
    };
  }

  async delete(code, senderJid) {
    const note = await prisma.note.findUnique({ where: { code } });

    if (!note) {
      throw new Error(__('cmd.tools.notes.notFound', { code }));
    }

    if (note.authorJid !== senderJid) {
      throw new Error(__('cmd.tools.notes.notAuthor'));
    }

    return await prisma.note.delete({ where: { code } });
  }

  async generateCode(customCode) {
    if (customCode) {
      if (customCode.length >= 20) {
        throw new Error(__('notes.codeLength'));
      }

      customCode = customCode.replace(/[^a-zA-Z0-9]/g, '');

      const existingNote = await prisma.note.findUnique({
        where: { code: customCode }
      });

      if (existingNote) {
        throw new Error(__('notes.codeExists', { code: customCode }));
      }
      return customCode;
    }

    let generatedCode;
    const maxLength = 4;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    do {
      generatedCode = '';
      for (let i = 0; i < maxLength; i++) {
        generatedCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (await prisma.note.findUnique({ where: { code: generatedCode } }));

    return generatedCode;
  }

  #getPaginationPages({ currentPage, totalPages, maxPages = 5 }) {
    let startPage, endPage;

    if (totalPages <= maxPages) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrentPage = Math.floor(maxPages / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPages / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrentPage) {
        startPage = 1;
        endPage = maxPages;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        startPage = totalPages - maxPages + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }

    const pages = Array.from(Array(endPage + 1 - startPage).keys()).map(i => startPage + i);

    if (startPage > 1) {
      pages.unshift('...');
      pages.unshift(1);
    }

    if (endPage < totalPages) {
      pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  }
}


const NotesInstance = new Notes();
export default NotesInstance;