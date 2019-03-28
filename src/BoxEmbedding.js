import React from 'react';
import _ from 'lodash';

export default function BoxEmbedding({embedding, style}) {
  const n = embedding.length;
  const size = 4;
  const rowsCount = Math.ceil(Math.sqrt(n));

  const cells = _.flatMap(_.range(0, rowsCount), rowIndex => {
    return _.range(0, rowsCount).map(columnIndex => [rowIndex, columnIndex]);
  });

  return (
    <svg
      className="BoxEmbedding-svg"
      style={style}
      preserveAspectRatio="none"
      viewBox={`0 0 ${rowsCount * size} ${rowsCount * size}`}
    >
      {cells.map(([rowIndex, columnIndex]) => {
        const number = embedding[rowIndex * size + columnIndex];
        // TODO(kr) just guess about why these are negative, need
        // to learn more, this just assumes they're [-0.5, 0.5]
        const color = 0.5 + number;
        return (
          <rect
            className="BoxEmbedding-rect"
            key={[rowIndex, columnIndex].join(',')}
            x={rowIndex * size}
            y={columnIndex * size}
            width={size}
            height={size}
            fill="black"
            opacity={color}
          />
        );
      })}
    </svg>
  );
}