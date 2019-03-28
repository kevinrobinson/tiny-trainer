import {useReducer} from 'react';
import _ from 'lodash';

export default function useLog(initial = {}) {
  const [{showLogs, logs}, dispatch] = useReducer(logReducer, {
    showLogs: false,
    logs: [],
    ...initial
  });
  const log = (...payload) => dispatch({type: 'log', payload});  
  const toggleShowLog = () => dispatch({type: 'toggle'});

  return {showLogs, logs, log, toggleShowLog};
}

function logReducer(state, action) {
  const {showLogs, logs} = state;
  const {type} = action;

  if (type ===  'log') {
    const args = action.payload;
    const output = args.map(arg => _.isObject(arg) ? JSON.stringify(arg) : arg).join(' ') + "\n";
    console.debug('logReducer:', output);
    return {...state, logs: logs.concat(output)};
  }

  if (type ===  'toggle') {
    return {...state, showLogs: !showLogs};
  }
  throw new Error(`unexpected type: ${type}`)
}
