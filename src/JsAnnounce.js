import * as staticMethods from './staticMethods.js'
import * as privateProps from './privateProps.js'

let currentInstance;

class JsAnnounce {
	constructor(...args) {
		// Prevent run in Node env
		if (typeof window === 'undefined') {
			return
		}

		// Check for the existence of Promise
		if (typeof Promise === 'undefined') {
			error('This package requires a Promise library, please include a shim to enable it in this browser (See: https://github.com/sweetalert2/sweetalert2/wiki/Migration-from-SweetAlert-to-SweetAlert2#1-ie-support)')
		}

		currentInstance = this;

		const outerParams = Object.freeze(this.constructor.argsToParams(args))

		Object.defineProperties(this, {
			params: {
				value: outerParams,
				writable: false,
				enumerable: true,
				configurable: true
			}
		})

		const promise = this._main(this.params)
    privateProps.promise.set(this, promise)
	}

	// `catch` cannot be the name of a module export, so we define our thenable methods here instead
	then(onFulfilled) {
		const promise = privateProps.promise.get(this)
		return promise.then(onFulfilled)
	}

	finally(onFinally) {
		const promise = privateProps.promise.get(this)
		return promise.finally(onFinally)
	}
}

// Object.assign(JsAnnounce, staticMethods)

export default JsAnnounce