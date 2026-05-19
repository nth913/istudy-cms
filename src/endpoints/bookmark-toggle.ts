import type { Endpoint } from 'payload'
import { handleToggle } from './_toggle-helper'

export const postsBookmark: Endpoint = {
  path: '/v1/posts/:id/bookmark',
  method: 'post',
  handler: (req) => handleToggle(req, 'post', 'bookmark'),
}

export const examsBookmark: Endpoint = {
  path: '/v1/exams/:id/bookmark',
  method: 'post',
  handler: (req) => handleToggle(req, 'exam', 'bookmark'),
}
