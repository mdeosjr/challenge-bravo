import { exchangeRatesRepository } from '../repositories/exchangeRatesRepository.js'

async function convert(from, to, amount) {
	if (!amount || !from || !to)
		throw {
			type: 'bad_request',
			message: 'Missing info to convert, check your parameters'
		}

	const exchange = await exchangeRatesRepository.getRatesPair(from, to)

	if (exchange.from === undefined || exchange.to === undefined)
		throw {
			type: 'unprocessable_entity',
			message: 'One or both currencies are not included in database'
		}

	const conversion = (exchange.from.rate * amount) / exchange.to.rate
	return `${amount} ${from} worth ${conversion} ${to}`
}

export const exchangeService = {
	convert
}