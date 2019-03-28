import React, { useState, useEffect } from 'react';
import {useQueryParam, StringParam} from 'use-query-params';
import _ from 'lodash';
import uuid from 'uuid/v4';
import qs from 'query-string';
import chroma from 'chroma-js';
import {loadModel, teachableExamplesFor, predict} from './classify';
import copyToClipboard from './copyToClipboard';
import {exampleDataSets} from './examples';
import useLog from './useLog';
import {colors} from './colors';
import {updatedList} from './patch';
import './App.css';
import Spinner from './Spinner';
import ProjectIngredients from './ProjectIngredients';
import LabelBucket from './LabelBucket';
import SelectFeed from './SelectFeed';
import Peek from './Peek';


export default function App() {
  if (window.location.pathname.indexOf('/peek') === 0) return <Peek />;

  const {showLogs, logs, log, toggleShowLog} = useLog({showLogs: false});
  const [labels, setLabels] = useState([]);
  const [examplesMap, setExamplesMap] = useState({});
  const [trainingData, setTrainingData] = useState(null);
  const [languageModel, setLanguageModel] = useState(null);
  const [classifier, setClassifier] = useState(null);
  const [results, setResults] = useState(null);
  const [feedKey, setFeedKey] = useState('associated-press')
  const [testSentences, setTestSentences] = useState([]);  
  const [q, setQ] = useQueryParam('q', StringParam);

  // load USE model
  useEffect(() => {
    if (languageModel !== null) return;
    log('Loading languageModel...');
    loadModel()
      .then(setLanguageModel)
      .then(() => log('languageModel loaded.'));
  }, [languageModel]);

  // query string
  const [hasReadQueryString, setHasReadQueryString] = useState(false);
  useEffect(() => {
    if (hasReadQueryString) return;

    log('readQueryString', feedKey);
    const queryString = qs.parse(window.location.search);
    const q = queryString.q || _.sample(exampleDataSets);
    const json = JSON.parse(atob(q));
    const {labels, examplesMap} = json;
    setExamplesMap(examplesMap);
    setLabels(labels);
    setHasReadQueryString(true);
  }, [hasReadQueryString, q]);

  useEffect(() => {
    window.history.replaceState(null, null, '?q=' + btoa(JSON.stringify({labels, examplesMap})));
  }, [labels, examplesMap]);

  // fetching news, clear any results too
  useEffect(() => {
    log('fetchRecentArticles...', feedKey);
    fetchRecentArticles(feedKey)
      .then(setTestSentences)
      .then(() => setResults(null))
      .then(() => log('fetchRecentArticles done.'));
  }, [feedKey]);

  // do training
  const [isTraining, setIsTraining] = useState(false);
  useEffect(() => {
    const shouldTrainClassifier = (
      (languageModel !== null) &&
      (trainingData !== null) &&
      (classifier === null) &&
      (!isTraining)
    );
    if (!shouldTrainClassifier) return;

    log("\nTraining...");
    setIsTraining(true);
    setTimeout(() => { // yield a tick since otherwise UI doesn't update
      teachableExamplesFor({languageModel, trainingData, log})
        .then(setClassifier)
        .then(() => log('Training done.'))
        .then(() => setIsTraining(false));
    }, 20);
  }, [isTraining, trainingData, languageModel, classifier]);

  // do prediction
  // TODO(kr) doesn't abort properly
  const [isPredicting, setIsPredicting] = useState(false);  
  useEffect(() => {
    const shouldPredict = (
      (!isTraining) &&
      (classifier !== null) &&
      (results === null) &&
      (!isPredicting)
    );
    if (!shouldPredict) return;

    setIsPredicting(true);
    log('Predicting...');
    predict({classifier, languageModel, testSentences, log})
      .then(r => setResults(r) || console.log('r', r))
      .then(() => log('Predicting done.'))
      .then(() => setIsPredicting(false));
  }, [isTraining, isPredicting, testSentences, classifier, results]);

  // Some bug here with UI not updating, even though
  // this is as expected.  React scheduler or browser GPU?
  // It happens in Safari but noot Chrome, so maybe browser side?
  const buttonText = isTraining
    ? 'Training...'
    : isPredicting
      ? 'Predicting...'
      : 'Train and Predict';
  return (
    <div className="App">
      <header className="App-header">
        <div className="App-bar">
          <span style={{marginRight: 40}}>Training data</span>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
            onClick={() => {
              if (!window.confirm('This will reset your work.  Load?')) return;
              setHasReadQueryString(false);
              setQ(_.sample(exampleDataSets));
            }}>
            Load example
          </button>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
            onClick={() => {
              if (!window.confirm('This will drop the dataset.  Clear?')) return;
              setLabels([newLabel()]);
              setExamplesMap({});
            }}>
            Clear
          </button>
          <button
            className="App-button"
            style={{color: '#eee', display: 'inline-block'}}
            onClick={() => setLabels(labels.concat(newLabel()))}>
            Add label
          </button>
        </div>
        <div className="App-buckets">
          {labels.map((label, labelIndex) => (
            <LabelBucket
              key={label.id}
              label={label}
              labelIndex={labelIndex}
              labels={labels}
              setLabels={setLabels}
              examplesMap={examplesMap}
              setExamplesMap={setExamplesMap}
            />
          ))}
        </div>
        <div className="App-training">
          <div>
            <button
              className="App-button App-button-train"
              style={{display: 'inline-block'}}
              disabled={!languageModel || isTraining || isPredicting}
              onClick={() => {
                log('\nclick:setTrainingData...');
                setTrainingData({labels, examplesMap});
                log('click:setClassifier...');
                setClassifier(null);
                log('click:setResults...');
                setResults(null);
              }}>
              {buttonText}
            </button>
            <button className="App-button"
              style={{marginLeft: 20, color: '#eee', display: 'inline-block'}}
              onClick={toggleShowLog}>
              Show logs
            </button>
            {results && (
              <button className="App-button"
                style={{marginLeft: 20, color: '#eee', display: 'inline-block'}}
                onClick={() => copyToClipboard(classifier)}>
                Copy!
              </button>
            )}
          </div>
          <Spinner style={{opacity: (isTraining || isPredicting) ? 1 : 0}} />
        </div>
        {showLogs && <pre className="App-debug">{logs}</pre>}
        <div className="App-results">
          <div style={{marginBottom: 10}}>
            <span style={{marginRight: 10}}>Test data from</span>
            <SelectFeed feedKey={feedKey} setFeedKey={setFeedKey} />
            <span> via <a target="_blank" rel="noopener noreferrer" style={{color: '#eee'}} href="https://newsapi.org">newsapi.org</a>, or edit yourself!</span>
          </div>
          {!results && testSentences.map((sentence, sentenceIndex) => (
            <div className="App-sentence" key={sentenceIndex}>
              <input
                type="text"
                className="App-test-sentence-input"
                disabled={isTraining || isPredicting}
                onChange={e => setTestSentences(updatedList(testSentences, sentence, e.target.value))}
                value={sentence}
              />
              <button
                className="App-button"
                style={{
                  position: 'absolute',
                  left: -40,
                  display: (isTraining || isPredicting) ? 'none' : 'auto'
                }}
                onClick={() => setTestSentences(_.without(testSentences, sentence))}>
                ×
              </button>
            </div>
          ))}
          {(results || []).map(result => (
            <div key={result.sentence}>
              <div className="App-result">
                <div>{result.sentence}</div>
                <div style={{
                  marginTop: 10,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end'
                }}>
                  {Object.keys(result.predictions.confidences).map(classIndex => {
                    const rating = result.predictions.confidences[classIndex];
                    return (
                      <div key={classIndex} style={{
                        flex: 1,
                        background: chroma(colors[classIndex]).alpha(rating),
                        color: chroma('#333').alpha(rating),
                        padding: 2,
                        height: 10,
                        fontSize: 10
                      }}>{Math.round(rating * 100)}%</div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <div className="App-ingredients"><ProjectIngredients /></div>
        </div>
      </header>
    </div>
  );
}

function newLabel() {
  return {
    id: uuid(),
    text: ''
  };
}

function fetchRecentArticles(feedKey) {
  const apiKey = 'ff6d0ce2e73f4f7a88a9a402f1994777';
  const url = `https://newsapi.org/v2/top-headlines?sources=${feedKey}&apiKey=${apiKey}`;
  return fetch(url)
    .then(r => r.json())
    .then(json => json.articles.map(a => a.title));
}
