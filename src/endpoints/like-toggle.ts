import type { Endpoint } from 'payload'
import { handleToggle } from './_toggle-helper'

export const postsLike: Endpoint = {
  path: '/v1/posts/:id/like',
  method: 'post',
  handler: (req) => handleToggle(req, 'post', 'like'),
}

export const examsLike: Endpoint = {
  path: '/v1/exams/:id/like',
  method: 'post',
  handler: (req) => handleToggle(req, 'exam', 'like'),
}
