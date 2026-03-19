import React from 'react';
import { ChevronLeft, Save, Download, GripVertical, Trash2, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AnnotationCanvas from './AnnotationCanvas';

interface Step {
  id: string;
  title: string;
  description: string;
  app_name: string;
  screenshot_path?: string;
}

function SortableStepItem({ step, onDelete }: { step: Step; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex items-start space-x-4 group shadow-sm hover:shadow-md transition-shadow">
      <div {...attributes} {...listeners} className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical size={20} />
      </div>

      <div className="w-40 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100">
        {step.screenshot_path ? <img src={step.screenshot_path} alt="Step screenshot" className="w-full h-full object-cover" /> : <div className="text-xs">No Screenshot</div>}
      </div>

      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-bold text-hachiai-grey">{step.title}</h4>
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-gray-100 rounded text-gray-500"><Edit2 size={16} /></button>
            <button onClick={() => onDelete(step.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={16} /></button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">{step.description}</p>
        <span className="inline-block mt-2 px-2 py-1 bg-hachiai-purple-light/30 text-hachiai-purple-dark text-[10px] font-bold rounded uppercase tracking-wider">
          {step.app_name}
        </span>
      </div>
    </div>
  );
}

export default function Editor({ onBack }: { onBack: () => void }) {
  const [steps, setSteps] = React.useState<Step[]>([
    { id: '1', title: 'Open Excel', description: 'User opened Microsoft Excel from the taskbar.', app_name: 'Excel' },
    { id: '2', title: 'Click "Blank Workbook"', description: 'User clicked on the "Blank Workbook" template.', app_name: 'Excel' },
    { id: '3', title: 'Enter Data', description: 'User typed "Monthly Report" into cell A1.', app_name: 'Excel' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const deleteStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-800">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"><ChevronLeft size={24} /></button>
          <div>
            <h1 className="font-bold text-xl text-hachiai-grey">Checkout Process Recording</h1>
            <p className="text-xs text-gray-400">Recorded on March 19, 2026 • 12 Steps</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
            <Save size={18} /> <span>Save Changes</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-2 bg-hachiai-purple text-white rounded-lg hover:bg-hachiai-purple-dark transition-colors font-bold text-sm shadow-md">
            <Download size={18} /> <span>Export Document</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Step List */}
        <div className="w-1/2 p-8 overflow-y-auto border-r border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-hachiai-grey">Workflow Steps</h3>
            <span className="text-sm text-gray-400">{steps.length} Steps Total</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {steps.map((step) => (
                <SortableStepItem key={step.id} step={step} onDelete={deleteStep} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Preview / Detailed Edit Area */}
        <div className="w-1/2 p-12 bg-gray-100 flex items-center justify-center overflow-auto">
          <AnnotationCanvas imageUrl="https://picsum.photos/800/600" />
        </div>
      </main>
    </div>
  );
}
