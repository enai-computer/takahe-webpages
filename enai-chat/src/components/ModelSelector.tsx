import { AiModel } from "../models";
import { twMerge } from "tailwind-merge";

interface ModelSelectorProps {
  isOpen: boolean;
  availableModels: AiModel[];
  selectedModel: AiModel;
  onSelectModel: (model: AiModel) => void;
  onRequestContext: (tokenLimit: number) => void;
  onToggle: () => void;
}

export function ModelSelector({
  isOpen,
  availableModels,
  selectedModel,
  onSelectModel,
  onRequestContext,
  onToggle
}: ModelSelectorProps) {
  return (
    <div className="relative md:block hidden">
      <button
        onClick={onToggle}
        className="w-full text-center mt-3 text-sm font-light text-sand-9 hover:text-sand-11 transition-colors"
      >
        Model: <strong className="font-medium">{selectedModel?.name || "Loading..."}</strong>
        <span className="ml-1 inline-block transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      
      {isOpen && availableModels.length > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-sand-1 border border-sand-6 rounded-lg shadow-lg p-2 min-w-[200px]">
          {availableModels.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onSelectModel(model);
                onRequestContext(model.token_limit);
                onToggle();
              }}
              className={twMerge(
                "w-full text-left px-3 py-2 rounded hover:bg-sand-3 transition-colors group relative",
                selectedModel?.id === model.id ? "bg-sand-4 text-sand-12 hover:text-sand-12" : "text-sand-11.5 hover:text-sand-11.5"
              )}
            >
              <div className="font-medium">{model.name}</div>
              <div className="absolute invisible group-hover:visible bg-sand-1 border border-sand-6 shadow-lg rounded-lg p-3 z-10 left-full top-0 ml-2 w-[250px] text-xs text-sand-11">
                {model.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 