import React from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'highlight' | 'blur';
}

export default function AnnotationCanvas({ imageUrl }: { imageUrl: string }) {
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [selectedId, selectShape] = React.useState<string | null>(null);

  const addAnnotation = (type: 'highlight' | 'blur') => {
    const newAnnotation: Annotation = {
      id: Math.random().toString(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      type,
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex space-x-4">
        <button onClick={() => addAnnotation('highlight')} className="px-4 py-2 bg-yellow-400/50 border border-yellow-600 rounded-lg text-xs font-bold">Add Highlight</button>
        <button onClick={() => addAnnotation('blur')} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold">Add Blur</button>
      </div>

      <div className="relative bg-white shadow-xl rounded-lg overflow-hidden border border-gray-300">
        <img src={imageUrl} alt="Base" className="max-w-full max-h-[60vh]" id="base-image" />
        <div className="absolute inset-0">
          <Stage
            width={800} // Dynamic width/height based on image would be better in prod
            height={600}
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) {
                selectShape(null);
              }
            }}
          >
            <Layer>
              {annotations.map((ann, i) => (
                <Rect
                  key={ann.id}
                  id={ann.id}
                  x={ann.x}
                  y={ann.y}
                  width={ann.width}
                  height={ann.height}
                  fill={ann.type === 'highlight' ? 'rgba(255, 255, 0, 0.3)' : 'rgba(0, 0, 0, 0.8)'}
                  stroke={ann.type === 'highlight' ? 'yellow' : 'black'}
                  draggable
                  onClick={() => selectShape(ann.id)}
                  onDragEnd={(e) => {
                    const newAnns = [...annotations];
                    newAnns[i] = { ...newAnns[i], x: e.target.x(), y: e.target.y() };
                    setAnnotations(newAnns);
                  }}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
