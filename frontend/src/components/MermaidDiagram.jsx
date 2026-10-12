import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Download, Code, Sparkles, Network } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  themeVariables: {
    fontSize: '20px',
  },
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

export function MermaidDiagram({ diagram }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [showRawCode, setShowRawCode] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const mermaidCode = diagram?.mermaid || '';

  useEffect(() => {
    if (!mermaidCode) return;

    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, mermaidCode);
        setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setRenderError("Failed to render Mermaid chart.");
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boardsnap-diagram-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!diagram) {
    return (
      <div className="retro-card p-6 mb-8 text-center text-ink-muted bg-white font-mono text-xs">
        No diagram detected on this whiteboard.
      </div>
    );
  }

  return (
    <div className="retro-card p-6 mb-8 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-ink/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-ink font-mono">Rebuilt Flowchart Diagram</h3>
            <span className="text-xs bg-banana-300 text-ink font-mono font-bold px-2.5 py-0.5 rounded-md border border-ink shadow-retro-sm">
              Vector Mermaid AST
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-medium">
            Hand-drawn shapes & arrows reconstructed into crisp, editable vector Mermaid syntax.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawCode(!showRawCode)}
            className={`retro-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
              showRawCode
                ? 'bg-ink text-banana-300'
                : 'bg-white text-ink hover:bg-cream-100'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showRawCode ? 'Show Diagram' : 'View Code'}</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="retro-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-banana-100 text-ink flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-vine-500" /> : <Copy className="w-3.5 h-3.5 text-ink" />}
            <span>{copied ? 'Copied!' : 'Copy Mermaid'}</span>
          </button>

          <button
            onClick={handleDownloadSVG}
            disabled={!svgContent}
            className="retro-btn px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-banana-400 hover:bg-banana-500 text-ink flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-ink" />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* Diagram Viewer */}
      {showRawCode ? (
        <div className="bg-ink text-banana-300 rounded-xl p-4 font-mono text-xs overflow-x-auto border-2 border-ink shadow-retro-sm">
          <pre>{mermaidCode}</pre>
        </div>
      ) : (
        <div className="bg-cream-100 rounded-xl p-6 border-2 border-ink shadow-retro-sm min-h-[220px] flex items-center justify-center overflow-x-auto">
          {renderError ? (
            <div className="text-xs text-ripe font-mono bg-white p-3 rounded-lg border border-ink">
              {renderError}
            </div>
          ) : svgContent ? (
            <div
              ref={containerRef}
              dangerouslySetInnerHTML={{ __html: svgContent }}
              className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            />
          ) : (
            <div className="text-xs font-mono text-ink-muted animate-pulse">
              Reconstructing graph vectors...
            </div>
          )}
        </div>
      )}

      {/* Graph Properties */}
      {diagram.nodes && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-ink-muted pt-3 border-t-2 border-ink/10">
          <span className="font-bold text-ink">Graph Architecture:</span>
          <span><strong>{diagram.nodes.length}</strong> Nodes</span>
          <span>&bull;</span>
          <span><strong>{diagram.edges?.length || 0}</strong> Directed Edges</span>
        </div>
      )}
    </div>
  );
}
