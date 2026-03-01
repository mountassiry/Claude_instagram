import { query, mutate, Row } from '../db';

export type PostType = 'photo' | 'video' | 'text';

export interface PostRow {
  id: string;
  authorId: string;
  type: PostType;
  caption: string;
  mediaUris: string[];   // local file URIs on this device
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: number;
}

export interface CommentRow {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: number;
}

function rowToPost(r: Row): PostRow {
  return {
    id: r.id,
    authorId: r.author_id,
    type: r.type,
    caption: r.caption ?? '',
    mediaUris: JSON.parse(r.media_uris ?? '[]'),
    likesCount: r.likes_count ?? 0,
    commentsCount: r.comments_count ?? 0,
    isLiked: Boolean(r.is_liked),
    createdAt: r.created_at,
  };
}

function rowToComment(r: Row): CommentRow {
  return {
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    text: r.text,
    createdAt: r.created_at,
  };
}

/** Get feed posts (own + contacts), newest first. */
export async function getFeedPosts(limit = 30, before?: number): Promise<PostRow[]> {
  const rows = before
    ? await query(
        'SELECT * FROM posts WHERE created_at < ? ORDER BY created_at DESC LIMIT ?',
        [before, limit],
      )
    : await query('SELECT * FROM posts ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows.map(rowToPost);
}

/** Get posts by a specific author. */
export async function getPostsByAuthor(authorId: string): Promise<PostRow[]> {
  const rows = await query(
    'SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC',
    [authorId],
  );
  return rows.map(rowToPost);
}

export async function getPost(id: string): Promise<PostRow | null> {
  const rows = await query('SELECT * FROM posts WHERE id = ?', [id]);
  return rows.length > 0 ? rowToPost(rows[0]) : null;
}

export async function insertPost(post: PostRow): Promise<void> {
  await mutate(
    `INSERT OR IGNORE INTO posts
      (id, author_id, type, caption, media_uris, likes_count, comments_count, is_liked, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      post.id,
      post.authorId,
      post.type,
      post.caption,
      JSON.stringify(post.mediaUris),
      post.likesCount,
      post.commentsCount,
      post.isLiked ? 1 : 0,
      post.createdAt,
    ],
  );
}

export async function deletePost(id: string): Promise<void> {
  await mutate('DELETE FROM posts WHERE id = ?', [id]);
  await mutate('DELETE FROM comments WHERE post_id = ?', [id]);
  await mutate('DELETE FROM post_likes WHERE post_id = ?', [id]);
}

export async function likePost(postId: string, peerId: string): Promise<void> {
  const now = Date.now();
  await mutate(
    'INSERT OR IGNORE INTO post_likes (post_id, peer_id, created_at) VALUES (?, ?, ?)',
    [postId, peerId, now],
  );
  await mutate('UPDATE posts SET likes_count = likes_count + 1, is_liked = 1 WHERE id = ?', [postId]);
}

export async function unlikePost(postId: string, peerId: string): Promise<void> {
  await mutate('DELETE FROM post_likes WHERE post_id = ? AND peer_id = ?', [postId, peerId]);
  await mutate('UPDATE posts SET likes_count = MAX(0, likes_count - 1), is_liked = 0 WHERE id = ?', [postId]);
}

export async function getComments(postId: string): Promise<CommentRow[]> {
  const rows = await query(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
    [postId],
  );
  return rows.map(rowToComment);
}

export async function insertComment(comment: CommentRow): Promise<void> {
  await mutate(
    'INSERT OR IGNORE INTO comments (id, post_id, author_id, text, created_at) VALUES (?, ?, ?, ?, ?)',
    [comment.id, comment.postId, comment.authorId, comment.text, comment.createdAt],
  );
  await mutate('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [comment.postId]);
}
