import { Component } from 'react';
import { recoverFromRuntimeError } from '../utils/runtimeRecovery';

export default class RuntimeRecoveryBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    void recoverFromRuntimeError(`react:${error?.message || 'render-error'}`);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

