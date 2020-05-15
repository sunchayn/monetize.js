/**
 * Promise potential states.
 * @type {{FAILED: number, SUCCEEDED: number, PENDING: number}}
 */
const $states = {
  PENDING: 1,
  FAILED: 2,
  SUCCEEDED: 3,
};

/**
 * Promise-like syntax that allow resolving the call multiple times.
 */
class PromiseLoop {
  /**
   * Class constructor
   * @param {function} resolver responsible for changing the PromiseLoop state.
   */
  constructor(resolver) {
    /**
     * @type {null}
     * @private
     */
    this._state = $states.PENDING;

    /**
     * The result to delivery for the next callback (then or catch).
     * @type {null|object|string|number}
     * @private
     */
    this._result = null;

    /**
     * Then callback
     * @type {null|function}
     * @private
     */
    this._resolvedCallback = null;

    /**
     * Catch callback
     * @type {null|function}
     * @private
     */
    this._rejectCallback = null;

    /**
     * Indicate if the promise is finalized. Once finalized future call for resolve will be ignored.
     * @type {boolean}
     * @private
     */
    this._finalized = false;

    /**
     * Rejecting the promise logic.
     * @param result
     * @private
     */
    const _reject = (result) => {
      this._state = $states.FAILED;
      this._result = result;
    };

    /**
     * Resolving the promise logic.
     * @param result
     * @private
     */
    const _resolve = (result) => {
      this._state = $states.SUCCEEDED;
      this._result = result;

      // It recall future Resolves if allowed.
      if (!this._finalized && typeof this._resolvedCallback === 'function') {
        this._resolvedCallback(result);

        if (this._isOneTime) {
          this._finalized = true;
        }
      }
    };

    /**
     * Fetch the Initial promise status.
     * @type {void|boolean} If it return true. Then the promise will be resolved only once.
     * @private
     */
    this._isOneTime = resolver(_resolve, _reject) || false;
  }

  /**
   * Determine if the promise status is success.
   * @returns {boolean}
   * @private
   */
  _isSucceeded() {
    return this._state === $states.SUCCEEDED;
  }

  /**
   * Determine if the promise status is failure.
   * @returns {boolean}
   * @private
   */
  _isFailed() {
    return this._state === $states.FAILED;
  }

  /**
   * Then callback to run the resolved logic.
   * @param callback
   * @returns {PromiseLoop}
   */
  then(callback) {
    this._resolvedCallback = callback;

    if (this._isSucceeded()) {
      if (this._isOneTime) {
        this._finalized = true;
      }

      callback(this._result);
    }

    return this;
  }

  /**
   * Catch callback to run the rejected logic.
   * @param callback
   * @returns {PromiseLoop}
   */
  catch(callback) {
    this._rejectCallback = callback;

    if (this._isFailed()) {
      if (this._isOneTime) {
        this._finalized = true;
      }

      callback(this._result);
    }

    return this;
  }
}

export default PromiseLoop;
