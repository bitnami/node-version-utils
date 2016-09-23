'use strict';

const _ = require('lodash');
const chai = require('chai');
const expect = chai.expect;

const vu = require('../index.js');

/* eslint-disable no-unused-expressions */

describe('#getSemanticVersion()', () => {
  it('undertands "x.y.z" format', () => {
    expect(vu.getSemanticVersion('1.2.3')).to.be.eql('1.2.3');
  });

  it('undertands "x.y" format', () => {
    expect(vu.getSemanticVersion('1.2')).to.be.eql('1.2.0');
  });

  it('undertands "x" format', () => {
    expect(vu.getSemanticVersion('1')).to.be.eql('1.0.0');
  });

  it('throws if it cannot convert', () => {
    const aux = 'thisIsNotAVersion';
    expect(() => vu.getSemanticVersion(aux))
      .to.throw(`Cannot convert provided version ("${aux}") to semantic format`);
  });

  it('removes starting non numeric characters', () => {
    expect(vu.getSemanticVersion('someText1.2.3')).to.be.eql('1.2.3');
  });

  it('takes trailing information starting with "-" as preRelease/revision', () => {
    expect(vu.getSemanticVersion('1.2.3-beta1')).to.be.eql('1.2.3-beta1');
    expect(vu.getSemanticVersion('1.2-beta1')).to.be.eql('1.2.0-beta1');
    expect(vu.getSemanticVersion('1-beta1')).to.be.eql('1.0.0-beta1');
    expect(vu.getSemanticVersion('1-0')).to.be.eql('1.0.0-0');
  });

  it('takes trailing information starting with "." as preRelease/revision', () => {
    expect(vu.getSemanticVersion('1.2.3.patch1')).to.be.eql('1.2.3-patch1');
    expect(vu.getSemanticVersion('1.2.patch1')).to.be.eql('1.2.0-patch1');
    expect(vu.getSemanticVersion('1.patch1')).to.be.eql('1.0.0-patch1');
    expect(vu.getSemanticVersion('1.2.1.1patch1')).to.be.eql('1.2.1-1patch1');
  });

  it('takes trailing information starting with alphabetic character as preRelease/revision', () => {
    expect(vu.getSemanticVersion('1.2.3patch1')).to.be.eql('1.2.3-patch1');
  });

  it('returns the version without the revision if option `omitPreRelease`', () => {
    expect(vu.getSemanticVersion('1.2.3-something', {omitPreRelease: true})).to.be.eql('1.2.3');
  });
});


describe('#compareVersions()', () => {
  it('compares equals versions correctly', () => {
    const comps = [
      ['0.0.0', '0.0.0'],
      ['0.0.1', '0.0.1'],
      ['1.0.1-', '1.0.1-'],
      ['1.0.0-', '1'],
      ['1.0.0-', '1.0'],
      ['1.0.1-beta', '1.0.1-beta'],
      ['1.0-beta', '1.0-beta'],
      ['1-beta', '1-beta']
    ];

    _.each(comps, (versions) => {
      expect(vu.compareVersions(...versions), `comparing "${versions[0]}" and "${versions[1]}"`).to.be.eql(0);
    });
  });

  it('compares patches', () => {
    const comps = [
      ['0.0.1', '0.0.0'],
      ['1.0.1', '1.0.0'],
      ['0.0.1', '0.0.0-beta'],
      ['0.0.1-beta', '0.0.0'],
      ['0.0.1-beta', '0.0.0-beta']
    ];

    _.each(comps, (versions) => {
      const msg = `comparing "${versions[0]}" and "${versions[1]}"`;
      expect(vu.compareVersions(...versions), msg).to.be.eql(1);
      expect(vu.compareVersions(...versions.reverse()), msg).to.be.eql(-1);
    });
  });

  it('compares minor versions', () => {
    const comps = [
      ['0.1.0', '0.0.0'],
      ['0.1.0', '0.0.1'],
      ['0.1.1', '0.0.1'],
      ['0.1.1', '0.0.1'],
      ['0.1', '0.0'],
      ['1.1', '1.0'],
      ['0.1.0', '0.0.0-beta'],
      ['0.1', '0.0-beta']
    ];

    _.each(comps, (versions) => {
      const msg = `comparing "${versions[0]}" and "${versions[1]}"`;
      expect(vu.compareVersions(...versions), msg).to.be.eql(1);
      expect(vu.compareVersions(...versions.reverse()), msg).to.be.eql(-1);
    });
  });

  it('compares mayor versions', () => {
    const comps = [
      ['1.0.0', '0.0.0'],
      ['1.0', '0.1'],
      ['1', '0'],
      ['1.1', '1.0'],
      ['1.0.0', '1.0.0-beta'],
      ['1.0', '1.0-beta'],
      ['1', '1-beta']
    ];

    _.each(comps, (versions) => {
      const msg = `comparing "${versions[0]}" and "${versions[1]}"`;
      expect(vu.compareVersions(...versions), msg).to.be.eql(1);
      expect(vu.compareVersions(...versions.reverse()), msg).to.be.eql(-1);
    });
  });

  it('compares preReleases', () => {
    const comps = [
      ['1', '1-beta1'],
      ['1-beta2', '1-beta1'],
      ['1-beta1', '1-beta0'],
      ['1-2', '1-1'],
      ['1-1', '1-0']
    ];

    _.each(comps, (versions) => {
      const msg = `comparing "${versions[0]}" and "${versions[1]}"`;
      expect(vu.compareVersions(...versions), msg).to.be.eql(1);
      expect(vu.compareVersions(...versions.reverse()), msg).to.be.eql(-1);
    });
  });
});

describe('#isSpecificVersion()', () => {
  it('returns false is version not defined', () => {
    expect(vu.isSpecificVersion()).to.be.false;
  });

  it('returns false is version null', () => {
    expect(vu.isSpecificVersion(null)).to.be.false;
  });

  it('returns true if "x"', () => {
    _.each(['0', '1', '12'], (v) => {
      const msg = `checking "${v} is specific"`;
      expect(vu.isSpecificVersion(v), msg).to.be.true;
    });
  });

  it('returns true if "x.y"', () => {
    _.each(['0.0', '0.1'], (v) => {
      const msg = `checking "${v} is specific"`;
      expect(vu.isSpecificVersion(v), msg).to.be.true;
    });
  });

  it('returns true if "x.y.z"', () => {
    _.each(['0.0.0', '0.1.0'], (v) => {
      const msg = `checking "${v} is specific"`;
      expect(vu.isSpecificVersion(v), msg).to.be.true;
    });
  });

  it('returns true if "x.y.z-preRelease"', () => {
    _.each(['1beta', '1-beta', '1.1-beta', '1.1.1-beta', '1.2.3-0'], (v) => {
      const msg = `checking "${v} is specific"`;
      expect(vu.isSpecificVersion(v), msg).to.be.true;
    });
  });

  it('returns false if "^x.y.z"', () => {
    _.each(['^1', '^1.2', '^1.2.3'], (v) => {
      const msg = `checking "${v} is specific"`;
      expect(vu.isSpecificVersion(v), msg).to.be.false;
    });
  });

  it('returns false if ">=a.b.c <x.y.z"', () => {
    _.each(['>=1 <1', '>=1.2', '<5'], (v) => {
      const msg = `checking "${v} is specific"`;
      expect(vu.isSpecificVersion(v), msg).to.be.false;
    });
  });
});
