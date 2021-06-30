'use strict';

const _ = require('lodash');
const semver = require('semver');

/**
 * @namespace versionUtils
 */

/**
 * Generates semantic version from a generic version format.
 * @memberof versionUtils
 * @param {string} version Version to convert
 * @param {Object} [options]
 * @param {string} [options.omitPreRelease=false] Omit the tag after the version (`-beta` in `0.5.0-beta`)
 * @returns {string} Conversion to semantic format
 * @throws {Error} If input cannot be converted to semantic format automatically
 */
function getSemanticVersion(version, options) {
  options = _.defaults(options, {omitPreRelease: false});

  const matchedVersion = version.match(/(\d+)\.?([^\[a-zA-Z\-\.\]]+)?\.?(.*)/); // eslint-disable-line no-useless-escape

  if (!matchedVersion) {
    throw new Error(`Cannot convert provided version ("${version}") to semantic format`);
  }

  const majorVersion = matchedVersion[1];
  let minorVersion = 0;
  let patch = 0;
  let preRelease = null;
  if (!_.isUndefined(matchedVersion[2])) {
    // Cases: 1.2.3 or 1.2-beta1
    minorVersion = matchedVersion[2];
  }
  if (matchedVersion[3].match(/^\d+$/)) {
    // Case 1.2.3
    patch = matchedVersion[3];
  } else {
    if (!_.isEmpty(matchedVersion[3])) {
      // Full Versions. F.e: 1.2b1, 1.2.0 or 1.2.3-beta1
      const parsedPatch = matchedVersion[3].match(/^(\d+)?[\-\._]?(.*)$/); // eslint-disable-line no-useless-escape
      if (!_.isUndefined(parsedPatch[1])) {
        // Case 1.2.3 or 1.2.3-beta1
        patch = parsedPatch[1];
      }
      if (!_.isEmpty(parsedPatch[2])) {
        // Case 1.2b1, 1.2.3-beta1 or 1.2.3.beta1
        preRelease = parsedPatch[2];
      }
    }
  }
  let result = _.map([majorVersion, minorVersion, patch], (n) => parseInt(n, 10)).join('.');
  if (!options.omitPreRelease && !_.isNull(preRelease)) result += `-${preRelease}`;
  return result;
}

/**
 * Compares two versions according to semantic versioning criteria.
 *
 * @memberof versionUtils
 * @param {string} v1 Version to compare
 * @param {string} v2 The other version to compare
 * @returns {number} 0 if both versions resolves to the same one.
 * 1 if {@linkcode v1} is greater than {@linkcode v2}. -1 if {@linkcode v2} is greater than {@linkcode v1}
 * @throws {Error} If input cannot be converted to semantic format automatically
 */
function compareVersions(v1, v2) {
  const _v1 = getSemanticVersion(v1);
  const _v2 = getSemanticVersion(v2);
  return semver.compare(_v1, _v2);
}

/**
 * Checks if a given version is a specific version or a range.
 *
 * @memberof versionUtils
 * @param {string} version Version to check
 * @returns {boolean} true if {@linkcode version} is specific and false if it isn't.
 */
function isSpecificVersion(version) {
  if (_.isNull(version) || _.isUndefined(version)) {
    return false;
  } else if (semver.validRange(version) === version) {
    // Case version=1.1.1
    return true;
  } else if (!_.isEmpty(version) && _.isNull(semver.validRange(version))) {
    // Case version don't follow semver standard f.e: 1.1beta
    return true;
  } else {
    if (!_.isEmpty(version) && version.match(/^[0-9].*/)) {
      // Case version don't follow the standard and is a valid range f.e: 1.1
      return true;
    } else {
      // Case version is empty or it is a range
      return false;
    }
  }
}


/**
 * Check that the current node process matches certain version requirements.
 *
 * Some code requires a specific node version to work. If that is the case then
 * this function can be called to check whether the current node process version
 * (as defined in `process.version` matches the requirements). If it does not
 * then an error can be thrown.
 *
 * The check can be overriden by setting the `FORCE_NODE_VERSION` environment
 * variable.
 *
 * @memberof versionUtils
 * @param {string} requirements - the requirements that have to specified, as
 *     a semver requirements list.
 * @throws {Error} if `process.version` doesn't meet the specified requirements
 *     and the user hasn't overriden the check with the `FORCE_NODE_VERSION`
 *     environment variable.
 * @example
 * checkNodeVersionSatisfies('>=6');
 * @example
 * checkNodeVersionSatisfies('>=5 <6');
 */
function checkNodeVersionSatisfies(requirements) {
  if (_.isUndefined(process.env.FORCE_NODE_VERSION)
      && !semver.satisfies(process.version, requirements)) {
    throw new Error(
      `Node version ${process.version} doesn't match the requirements for this tool: ${requirements}`);
  }
}


module.exports = {
  compareVersions,
  getSemanticVersion,
  isSpecificVersion,
  checkNodeVersionSatisfies
};
