const { nanoid } = require('nanoid')
const { Pool } = require('pg')
const { mapDBToModel } = require('../../utils')
const InvariantError = require('../../exceptions/InvariantError')
const NotFoundError = require('../../exceptions/NotFoundError')

class SongsService {
  constructor() {
    this._pool = new Pool()
  }

  async addSong({ title, year, genre, performer, duration, albumId }) {
    const id = `song-${nanoid(16)}`

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId]
    }

    const result = await this._pool.query(query)

    if (!result.rows[0].id) {
      throw new InvariantError('Song gagal ditambahkan')
    }

    return result.rows[0].id
  }

  async getSongs(title, performer) {
    let query = ''

    if (title) {
      const lowTitle = title.toLowerCase()
      query = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER(title) LIKE $1',
        values: [`%${lowTitle}%`]
      }

      if (performer) {
        const lowPerformer = performer.toLowerCase()
        query = {
          text: 'SELECT id, title, performer FROM songs WHERE LOWER(title) LIKE $1 AND LOWER(performer) LIKE $2',
          values: [`%${lowTitle}%`, `%${lowPerformer}%`]
        }
      }
    } else if (!title && performer) {
      const lowPerformer = performer.toLowerCase()
      query = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER(performer) LIKE $1',
        values: [`%${lowPerformer}%`]
      }
    } else {
      query = 'SELECT id, title, performer FROM songs'
    }

    const result = await this._pool.query(query)

    return result.rows.map(mapDBToModel)
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Song tidak ditemukan')
    }

    return result.rows.map(mapDBToModel)[0]
  }

  async editSongById(id, { title, year, genre, performer, duration, albumId }) {
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, "albumId" = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui song')
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id]
    }

    const result = await this._pool.query(query)

    if (!result.rows.length) {
      throw new NotFoundError('Song gagal dihapus')
    }
  }
}

module.exports = SongsService
