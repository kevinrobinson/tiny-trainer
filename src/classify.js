import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import _ from 'lodash';


export function loadModel() {
  return use.load();  
}

// Returns a 2D tensor consisting of the 512-dimensional embeddings for each sentence.
// So with two sentences, embeddings has the shape [2, 512].
async function embeddingsFor(model, sentences) {
  return model.embed(sentences);
}


export async function teachableExamplesFor({languageModel, trainingData, log}) {
  const {labels, examplesMap} = trainingData;

  // flatten examples
  log('Training, gathering examples...');
  const teachableExamples = _.flatMap(labels, (label, labelIndex) => {
    const examples = examplesMap[label.id];
    return examples.map(example => { return {example, labelIndex}; });
  });

  // map to embeddings
  log('Training, mapping to embeddings...');
  const teachableVectors = await Promise.all(teachableExamples.map(async (teachableExample) => {
    const {example, labelIndex} = teachableExample;
    const embeddings = await embeddingsFor(languageModel, [example.text]);
    return {embeddings, labelIndex};
  }));
  
  // add examples to classifier
  const classifier = knnClassifier.create();
  teachableVectors.forEach(({embeddings, labelIndex}) => {
    log('Training, adding example...');
    classifier.addExample(embeddings, labelIndex);
  });

  return classifier;
}


// Predict classes for testSentences by getting embeddings from the languageModel, and
// then feeding those through classifier
export async function predict({languageModel, classifier, testSentences, log}) {
  log('Predicting, mapping to embeddings...');
  const embeddings = await (await embeddingsFor(languageModel, testSentences)).array();
  console.log('embeddings', embeddings);

  log('Predicting, classifying...');
  const results = await Promise.all(embeddings.map(async (embedding, index) => {
    const predictions = await classifier.predictClass(tf.tensor(embedding));
    const sentence = testSentences[index];
    return {embedding, predictions, sentence};
  }));
  console.log('results', results);
  return results;
}
