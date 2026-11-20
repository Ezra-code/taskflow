import prisma from "../config/prisma.js";

export const createTodo = async (userId, data) => {
  return prisma.todo.create({
    data: {
      title: data.title,
      description: data.description,
      userId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      completed: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const getTodos = async (
  userId,
  filters = {},
  sort = {},
  pagination = {}
) => {
  const where = {
    userId,
    ...filters,
  };

  const orderBy = {
    [sort.sortBy || "createdAt"]: sort.sortOrder || "desc",
  };

  const { skip = 0, take = 10 } = pagination;

  const [todos, total] = await prisma.$transaction([
    prisma.todo.findMany({
      where,
      orderBy,
      skip,
      take,
    }),

    prisma.todo.count({
      where,
    }),
  ]);

  return { todos, total };
};

export const getTodoById = async (userId, todoId) => {
  return prisma.todo.findFirst({
    where: {
      id: todoId,
      userId,
    },
  });
};

export const updateTodo = async (userId, todoId, data) => {
  const result = await prisma.todo.updateMany({
    where: {
      id: todoId,
      userId,
    },
    data,
  });

  if (result.count === 0) {
    return null;
  }

  return getTodoById(userId, todoId);
};


export const deleteTodo = async (userId, todoId) => {
  const result = await prisma.todo.deleteMany({
    where: {
      id: todoId,
      userId,
    },
  });

  return result.count > 0;
};

export const setTodoCompletion = async (userId, todoId, completed) => {
  const result = await prisma.todo.updateMany({
    where: {
      id: todoId,
      userId,
    },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getTodoById(userId, todoId);
};