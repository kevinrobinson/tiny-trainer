import * as knnClassifier from '@tensorflow-models/knn-classifier';

export function teach(examples) {
  const classifier = knnClassifier.create();
  examples.forEach(({embeddings, labelIndex}) => {
    classifier.addExample(embeddings, labelIndex);
  });

  return classifier;
}
