import supertest from 'supertest'
import app from '../../src/index.js'
import { redis } from '../../src/db.js'
import { initTest } from '../utils/initTest.js'

const request = supertest(app)
let currenciesTest

beforeAll(async () => {
	currenciesTest = await initTest()
})

afterAll(async () => {
	await redis.del('currencies-test')
	await redis.disconnect()
})

describe('App integration tests', () => {
	describe('GET /currencies', () => {
		it('should return 200 and a list of currencies', async () => {
			const response = await request.get('/currencies')
			expect(response.status).toBe(200)
			expect(response.body).toEqual(currenciesTest)
		})
	})

	describe('GET /currencies/:code', () => {
		it('should return 200 and a currency', async () => {
			const response = await request.get('/currencies/USD')
			expect(response.status).toBe(200)
			expect(response.body).toEqual(currenciesTest[0])
		})
	})

	describe('POST /currencies', () => {
		it('should return 201 and persist in the database', async () => {
			const response = await request.post('/currencies').send({
				name: 'Moeda Teste',
				code: 'MTS',
				rate: 1.2,
				type: 'crypto'
			})

			const newCurrency = await redis.get('currencies-test')
			const currency = JSON.parse(newCurrency).find((c) => c.code === 'MTS')

			expect(currency.code).toEqual('MTS')
			expect(response.status).toBe(201)
		})

		it('should return 422 given invalid body', async () => {
			const response = await request.post('/currencies').send({
				name: 'Moeda Teste',
				code: 'MTS',
				rate: 1.2
			})

			expect(response.status).toBe(422)
		})
	})

	describe('DELETE /currencies/:code', () => {
		it('should return 200 and delete from database', async () => {
			const response = await request.delete('/currencies/MTS')

			const deletedCurrency = await redis.get('currencies-test')
			const currency = JSON.parse(deletedCurrency).find(
				(c) => c.code === 'MTS'
			)

			expect(currency).toBe(undefined)
			expect(response.status).toBe(200)
		})

		it('should return 404 if currency does not exist', async () => {
			const response = await request.delete('/currencies/NOT')
			expect(response.status).toBe(404)
		})
	})

	describe('POST /exchange', () => {
		it('should return 200 and the converted amount', async () => {
			const response = await request.post(
				'/exchange?from=USD&to=BRL&amount=10'
			)

			const conversion = {
				from: 'USD',
				to: 'BRL',
				amount: 10,
				conversion: 50
			}

			expect(response.status).toBe(200)
			expect(response.body).toEqual(conversion)
		})

		it('should return 500 if one or more queries are not provided', async () => {
			const response = await request.post('/exchange')
			expect(response.status).toBe(500)
		})
	})
})
