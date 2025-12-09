
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ImageConfig, TemplateCategory, TEMPLATE_CATEGORY_LABELS, UserEdits, EditableFieldKey, EDITABLE_FIELD_LABELS, TextOverlay } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import ImageCanvas from './ImageCanvas';
import Select from './common/Select';

const UserView: React.FC = () => {
  const { imageTemplates, loadTemplates } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<ImageConfig | null>(null);
  const [userEdits, setUserEdits] = useState<UserEdits>({});
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [editableOverlays, setEditableOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const canvasExportRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadTemplates(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (selectedTemplate) {
        setEditableOverlays(selectedTemplate.overlays);
    } else {
        setEditableOverlays([]);
    }
    setSelectedOverlayId(null);
    setIsDragging(false);
  }, [selectedTemplate]);

  const handleCategoryChange = (category: TemplateCategory | '') => {
    setSelectedCategory(category);
    setSelectedTemplate(null); 
    setUserEdits({});
    setImageLoadError(null);
  };

  const handleTemplateSelect = (template: ImageConfig) => {
    setSelectedTemplate(template);
    setImageLoadError(null);
    const initialEdits: UserEdits = {};
    template.overlays.forEach(overlay => {
      if (overlay.isEditableByUser && overlay.editKey) {
        initialEdits[overlay.editKey] = overlay.text; 
      }
    });
    if (template.logoOverlay?.isEditableByUser && template.logoOverlay.editKey) {
      initialEdits[template.logoOverlay.editKey] = template.logoOverlay.imageUrl;
    }
    setUserEdits(initialEdits);
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUserEditChange = (key: EditableFieldKey, value: string) => {
    setUserEdits(prev => ({ ...prev, [key]: value }));
  };
  
  const handleLogoFileUpload = (event: React.ChangeEvent<HTMLInputElement>, key: EditableFieldKey) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
        alert("يرجى اختيار ملف صورة صالح.");
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (typeof result === 'string') {
            handleUserEditChange(key, result);
        } else {
            alert("فشل في قراءة الملف.");
        }
    };
    reader.onerror = () => {
        alert("حدث خطأ أثناء قراءة الملف.");
    };
    reader.readAsDataURL(file);
    
    event.target.value = ''; 
  };
  
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
  };

    const handleCanvasClick = (x: number, y: number, targetOverlay: TextOverlay | null) => {
        if (isDragging) return;
        
        if (targetOverlay && targetOverlay.isEditableByUser) {
            setSelectedOverlayId(targetOverlay.id);
        } else {
            setSelectedOverlayId(null);
        }
    };

    const handleOverlayDragStart = useCallback((overlayId: string) => {
        if (overlayId === selectedOverlayId) {
            setIsDragging(true);
        }
    }, [selectedOverlayId]);

    const handleOverlayPositionUpdate = useCallback((overlayId: string, newX: number, newY: number) => {
        if (isDragging && overlayId === selectedOverlayId) {
            setEditableOverlays(prevOverlays =>
                prevOverlays.map(o => (o.id === overlayId ? { ...o, x: newX, y: newY } : o))
            );
        }
    }, [isDragging, selectedOverlayId]);

    const handleOverlayDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

  const handleExportImage = async () => {
    if (!selectedTemplate || !canvasExportRef.current) return;
    
    if (imageLoadError) {
      alert("لا يمكن تصدير الصورة لأن صورة القالب الأساسية فشلت في التحميل. يرجى إبلاغ المسؤول.");
      return;
    }
    
    const canvas = canvasExportRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = selectedTemplate.canvasWidth;
    canvas.height = selectedTemplate.canvasHeight;
    ctx.clearRect(0,0, canvas.width, canvas.height);

    try {
        const backgroundImg = await loadImage(selectedTemplate.imageUrl);
        ctx.drawImage(backgroundImg, 0, 0, selectedTemplate.canvasWidth, selectedTemplate.canvasHeight);

        editableOverlays.forEach((overlay) => {
            ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.color;
            ctx.textAlign = 'right';
            let textToDraw = overlay.text;
            if (overlay.isEditableByUser && overlay.editKey && userEdits[overlay.editKey] !== undefined) {
            textToDraw = userEdits[overlay.editKey];
            }
            ctx.fillText(textToDraw, overlay.x, overlay.y);
        });
        
        const logoConfig = selectedTemplate.logoOverlay;
        const userLogoUrl = logoConfig?.editKey ? userEdits[logoConfig.editKey] : undefined;
        const finalLogoUrl = userLogoUrl !== undefined ? userLogoUrl : logoConfig?.imageUrl;

        if (logoConfig && finalLogoUrl && finalLogoUrl.length > 0) {
            const logoImg = await loadImage(finalLogoUrl);
            ctx.save();
            ctx.beginPath();
            ctx.arc(logoConfig.x, logoConfig.y, logoConfig.radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logoImg, logoConfig.x - logoConfig.radius, logoConfig.y - logoConfig.radius, logoConfig.radius * 2, logoConfig.radius * 2);
            ctx.restore();
        }

        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${selectedTemplate.name.replace(/\s+/g, '_')}_modified.png`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error during image export:", error);
        alert("حدث خطأ أثناء تحميل الصور للتصدير. قد يكون أحد الروابط غير صالح أو غير متاح.");
    }
  };

  const filteredTemplates = selectedCategory
    ? imageTemplates.filter(t => t.category === selectedCategory)
    : imageTemplates; 

  const categoryOptions = Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => ({
    value: key,
    label: label,
  }));
  
  const currentEditableOverlays = selectedTemplate?.overlays.filter(o => o.isEditableByUser && o.editKey) || [];
  const logoEditKey = selectedTemplate?.logoOverlay?.editKey;
  const showLogoControls = selectedTemplate?.logoOverlay?.isEditableByUser && logoEditKey;

  // View: Selection Mode
  if (!selectedTemplate) {
    return (
        <div className="space-y-8">
            <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-xl">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                     <div className="flex-1">
                        <label className="block text-slate-400 mb-2 font-medium">تصفية القوالب حسب الفئة:</label>
                        <Select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value as TemplateCategory | '')}
                            options={[{ value: '', label: '📂 عرض جميع القوالب' }, ...categoryOptions]}
                            containerClassName="mb-0 max-w-md"
                            className="bg-slate-900 border-slate-600 focus:border-sky-500 hover:border-slate-500 transition-colors"
                        />
                     </div>
                     <div className="text-slate-400 text-sm pb-2">
                        {filteredTemplates.length} قالب متاح
                     </div>
                 </div>
            </div>

            {filteredTemplates.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-slate-600 mb-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <p className="text-lg text-slate-400 font-medium">لا توجد قوالب متاحة في الوقت الحالي.</p>
                    <p className="text-sm text-slate-500 mt-2">جرب تغيير الفئة أو تواصل مع المسؤول.</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                    <div key={template.id} 
                        className="group bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-sky-500/10 border border-slate-700 hover:border-sky-500/50 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                        onClick={() => handleTemplateSelect(template)}>
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-900">
                        <img 
                            src={template.imageUrl} 
                            alt={template.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                            loading="lazy"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-800');
                                const err = document.createElement('div');
                                err.innerHTML = `<svg class="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
                                target.parentElement?.appendChild(err);
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-2">
                                {TEMPLATE_CATEGORY_LABELS[template.category]}
                            </span>
                            <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">{template.name}</h3>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
  }

  // View: Editing Mode
  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
         <Button 
            onClick={() => { setSelectedTemplate(null); setUserEdits({}); setImageLoadError(null);}} 
            variant="secondary"
            className="flex items-center gap-2 pr-2"
         >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
            العودة للقوالب
         </Button>
         <h2 className="text-xl md:text-2xl font-bold text-slate-100 hidden sm:block">{selectedTemplate.name}</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Editor Sidebar */}
        <div className="lg:w-1/3 order-2 lg:order-1">
            <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden sticky top-24">
                <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
                     <h3 className="font-bold text-lg text-sky-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        أدوات التعديل
                     </h3>
                     <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        {currentEditableOverlays.length} حقول
                     </span>
                </div>
                
                <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                    {currentEditableOverlays.length === 0 && !showLogoControls && (
                        <div className="text-center py-8 text-slate-500">
                            <p>لا توجد حقول قابلة للتعديل.</p>
                        </div>
                    )}

                    {currentEditableOverlays.map(overlay => (
                        overlay.editKey && ( 
                        <div key={overlay.editKey} className={`transition-all duration-300 ${selectedOverlayId === overlay.id ? 'ring-2 ring-sky-500/50 rounded-lg p-2 bg-slate-700/30' : ''}`}>
                             <Input
                                label={EDITABLE_FIELD_LABELS[overlay.editKey] || overlay.editKey}
                                value={userEdits[overlay.editKey] || ''}
                                onChange={(e) => handleUserEditChange(overlay.editKey!, e.target.value)}
                                placeholder={`أدخل ${EDITABLE_FIELD_LABELS[overlay.editKey] || ''}...`}
                                onFocus={() => setSelectedOverlayId(overlay.id)}
                            />
                        </div>
                        )
                    ))}

                    {showLogoControls && logoEditKey && (
                        <div className="pt-4 border-t border-slate-700/50 mt-4">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                                {EDITABLE_FIELD_LABELS[logoEditKey]}
                            </h4>
                            
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-6 h-6 mb-2 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                        </svg>
                                        <p className="text-xs text-slate-400">اضغط لرفع صورة الشعار</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoFileUpload(e, logoEditKey)} />
                                </label>
                                
                                {userEdits[logoEditKey] && (userEdits[logoEditKey].startsWith('data:') || userEdits[logoEditKey].length > 0) && (
                                     <div className="mt-3 flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                                        <span className="text-xs text-green-400 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                                            تم اختيار شعار
                                        </span>
                                        <button 
                                            onClick={() => handleUserEditChange(logoEditKey, '')}
                                            className="text-red-400 hover:text-red-300 text-xs font-medium"
                                        >
                                            إزالة
                                        </button>
                                     </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-700">
                    <Button 
                        onClick={handleExportImage} 
                        variant="success" 
                        size="lg" 
                        className="w-full shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                        disabled={!!imageLoadError}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        حفظ وتصدير الصورة
                    </Button>
                </div>
            </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:w-2/3 order-1 lg:order-2">
            <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 relative">
                 {/* Toolbar for Canvas (Optional future expansion) */}
                 <div className="bg-slate-900/80 backdrop-blur text-xs text-slate-400 py-2 px-4 flex justify-between items-center border-b border-slate-700">
                    <span>مساحة العمل</span>
                    <span className="opacity-70">اسحب النصوص لتغيير مكانها</span>
                 </div>

                 <div className="p-4 md:p-8 bg-[#1e293b] flex justify-center items-start min-h-[500px] overflow-auto relative">
                     {/* Checkerboard pattern for transparency */}
                     <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                     
                     <div className="relative shadow-2xl shadow-black/50">
                        {imageLoadError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-red-400 z-10 p-4 text-center border border-red-800">
                                <div>
                                    <p className="font-bold mb-2">فشل تحميل الصورة</p>
                                    <p className="text-sm opacity-80">{imageLoadError}</p>
                                </div>
                            </div>
                        )}
                        <ImageCanvas 
                            imageUrl={selectedTemplate.imageUrl} 
                            overlays={editableOverlays}
                            logoOverlay={selectedTemplate.logoOverlay}
                            userEdits={userEdits}
                            canvasWidthProp={selectedTemplate.canvasWidth}
                            canvasHeightProp={selectedTemplate.canvasHeight}
                            backgroundColor="#ffffff"
                            onImageLoadError={() => {
                                setImageLoadError(`تعذر تحميل صورة الخلفية.`);
                            }}
                            onCanvasLeftClick={handleCanvasClick}
                            selectedOverlayId={selectedOverlayId}
                            isMovementEnabled={true}
                            onOverlayDragStart={handleOverlayDragStart}
                            onOverlayPositionUpdate={handleOverlayPositionUpdate}
                            onOverlayDragEnd={handleOverlayDragEnd}
                        />
                    </div>
                 </div>
            </div>
            <canvas ref={canvasExportRef} style={{ display: 'none' }}></canvas>
        </div>
      </div>
    </div>
  );
};

export default UserView;