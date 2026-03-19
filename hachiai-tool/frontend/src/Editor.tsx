import React from 'react';
import { ChevronLeft, Save, Download, GripVertical, Edit2, Trash2, FileText } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import AnnotationCanvas from './AnnotationCanvas';

interface Step {
  id: string;
  title: string;
  description: string;
  app_name: string;
  screenshot_path?: string;
  screenshot?: string;
}

interface EditorProps {
  onBack: () => void;
  recordingSteps?: Step[];
}

function SortableStepItem({ 
  step, 
  onDelete, 
  onEdit, 
  isSelected, 
  onClick 
}: { 
  step: Step; 
  onDelete: (id: string) => void; 
  onEdit: (id: string) => void; 
  isSelected: boolean; 
  onClick: (id: string) => void; 
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white border rounded-xl p-4 mb-4 flex items-start space-x-4 group shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'border-hachiai-purple shadow-lg' : 'border-gray-200'
      }`}
      onClick={() => onClick(step.id)}
    >
      <div {...attributes} {...listeners} className="mt-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical size={20} />
      </div>

      <div className="w-40 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-100">
        {step.screenshot ? (
          <img src={step.screenshot} alt="Step screenshot" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs">No Screenshot</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className="font-bold text-hachiai-grey">{step.title}</h4>
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(step.id);
              }} 
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(step.id);
              }} 
              className="p-1 hover:bg-red-50 rounded text-red-500"
            >
              <Trash2 size={16} />
            </button>
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

export default function Editor({ onBack, recordingSteps }: EditorProps) {
  const [steps, setSteps] = React.useState<Step[]>(recordingSteps || []);
  const [selectedStepId, setSelectedStepId] = React.useState<string | null>(null);
  const [editingStepId, setEditingStepId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({ title: '', description: '' });

  // Update steps when recordingSteps prop changes
  React.useEffect(() => {
    setSteps(recordingSteps || []);
  }, [recordingSteps]);

  // Select the first step by default if steps exist
  React.useEffect(() => {
    if (steps.length > 0 && !selectedStepId) {
      setSelectedStepId(steps[0].id);
    }
  }, [steps, selectedStepId]);

  const selectedStep = steps.find(step => step.id === selectedStepId);

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
    if (selectedStepId === id) {
      setSelectedStepId(null);
    }
  };

  const editStep = (id: string) => {
    const step = steps.find(s => s.id === id);
    if (step) {
      setEditingStepId(id);
      setEditForm({ title: step.title, description: step.description });
    }
  };

  const saveEdit = () => {
    if (editingStepId) {
      setSteps(steps.map(step => 
        step.id === editingStepId 
          ? { ...step, title: editForm.title, description: editForm.description }
          : step
      ));
      setEditingStepId(null);
      setEditForm({ title: '', description: '' });
    }
  };

  const cancelEdit = () => {
    setEditingStepId(null);
    setEditForm({ title: '', description: '' });
  };

  const selectStep = (id: string) => {
    setSelectedStepId(id);
  };

  const saveChanges = () => {
    console.log('Saving changes...');
    // TODO: Implement actual save functionality
  };

  const exportDocument = () => {
    const document = {
      title: 'Checkout Process Recording',
      date: 'March 19, 2026',
      steps: steps,
      annotations: [] // Would be populated from AnnotationCanvas
    };
    
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = 'checkout-process.json';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <button onClick={saveChanges} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
            <Save size={18} /> <span>Save Changes</span>
          </button>
          <button onClick={exportDocument} className="flex items-center space-x-2 px-6 py-2 bg-hachiai-purple text-white rounded-lg hover:bg-hachiai-purple-dark transition-colors font-bold text-sm shadow-md">
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
              {steps.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-500 mb-2">No Steps Recorded</h3>
                  <p className="text-gray-400">This recording doesn't contain any workflow steps yet.</p>
                </div>
              ) : (
                steps.map((step) => (
                  <SortableStepItem 
                    key={step.id} 
                    step={step} 
                    onDelete={deleteStep}
                    onEdit={editStep}
                    isSelected={selectedStepId === step.id}
                    onClick={selectStep}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </div>

        {/* Preview / Detailed Edit Area */}
        <div className="w-1/2 p-8 bg-gray-50 overflow-auto">
          {selectedStep ? (
            <div className="space-y-6">
              {/* Screenshot Display */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg text-hachiai-grey mb-4">Step Screenshot</h3>
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  {selectedStep.screenshot ? (
                    <img 
                      src={selectedStep.screenshot} 
                      alt="Step screenshot" 
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <FileText size={48} className="mx-auto mb-2" />
                        <p>No Screenshot Available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step Details */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg text-hachiai-grey mb-4">Step Details</h3>
                
                {editingStepId === selectedStep.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hachiai-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hachiai-purple"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 bg-hachiai-purple text-white rounded-lg hover:bg-hachiai-purple-dark transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-hachiai-grey text-xl">{selectedStep.title}</h4>
                      <p className="text-gray-600 mt-2">{selectedStep.description}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="inline-block px-3 py-1 bg-hachiai-purple-light/30 text-hachiai-purple-dark text-sm font-bold rounded-full">
                        {selectedStep.app_name}
                      </span>
                      <button
                        onClick={() => editStep(selectedStep.id)}
                        className="text-hachiai-purple hover:text-hachiai-purple-dark font-medium text-sm"
                      >
                        Edit Details
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Annotations */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-lg text-hachiai-grey mb-4">Annotations</h3>
                <AnnotationCanvas imageUrl={selectedStep.screenshot || ''} />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Select a Step</h3>
              <p className="text-gray-400">Click on a step to view its details and screenshot</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
