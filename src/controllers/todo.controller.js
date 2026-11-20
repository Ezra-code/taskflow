import {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  setTodoCompletion,
} from '../services/todo.service.js';
import createAppError from '../utils/appError.js';

export const create = async (req, res) => {
  const todo = await createTodo(req.user.id, req.body);

  res.status(201).json({
    status: 'success',
    message: 'Todo created successfully',
    data: {
      todo,
    },
  });
};
export const getAll = async (req, res) => {
  const { completed, sortBy, sortOrder, page, limit } = req.validatedQuery;

  const filters = {};

  if (completed !== undefined) {
    filters.completed = completed === 'true';
  }

  const sort = {
    sortBy,
    sortOrder,
  };

  const skip = (page - 1) * limit;

  const { todos, total } = await getTodos(req.user.id, filters, sort, {
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: 'success',
    results: todos.length,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
    data: { todos },
  });
};

export const getOne = async (req, res) => {
  const todo = await getTodoById(req.user.id, req.params.id);

  if (!todo) {
    throw createAppError('Todo not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      todo,
    },
  });
};

export const update = async (req, res) => {
  const todo = await updateTodo(req.user.id, req.params.id, req.body);

  if (!todo) {
    throw createAppError('Todo not found', 404);
  }

  res.status(200).json({
    status: 'success',
    message: 'Todo updated successfully',
    data: { todo },
  });
};

export const remove = async (req, res) => {
  const deleted = await deleteTodo(req.user.id, req.params.id);

  if (!deleted) {
    throw createAppError('Todo not found', 404);
  }

  res.status(200).json({
    status: 'success',
    message: 'Todo deleted successfully',
  });
};

export const setCompletion = async (req, res) => {
  const todo = await setTodoCompletion(
    req.user.id,
    req.params.id,
    req.body.completed,
  );

  if (!todo) {
    throw createAppError('Todo not found', 404);
  }

  res.status(200).json({
    status: 'success',
    message: 'Todo completion updated successfully',
    data: { todo },
  });
};
