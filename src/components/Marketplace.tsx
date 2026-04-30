import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Tag, 
  Star, 
  TrendingUp, 
  Search, 
  Filter, 
  Zap, 
  ExternalLink, 
  DollarSign, 
  BadgeCheck, 
  Package,
  FileText,
  Palette,
  CheckCircle,
  X,
  CreditCard,
  Crown
} from 'lucide-react';
import { marketplaceService } from '../services/marketplaceService';
import { MarketplaceItem, Purchase } from '../types';
import { auth } from '../lib/firebase';

export const Marketplace: React.FC = () => {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-library'>('discover');

  useEffect(() => {
    loadItems();
    loadMyPurchases();
  }, [filter, activeTab]);

  const loadItems = async () => {
    setLoading(true);
    const data = await marketplaceService.getMarketplaceItems(filter || undefined);
    setItems(data);
    setLoading(false);
  };

  const loadMyPurchases = async () => {
    const data = await marketplaceService.getMyPurchases();
    setMyPurchases(data);
  };

  const handlePurchase = async () => {
    if (!selectedItem) return;
    setPurchasing(true);
    // Simulate Stripe payment
    await new Promise(r => setTimeout(r, 2000));
    try {
      await marketplaceService.purchaseItem(selectedItem);
      loadMyPurchases();
      setSelectedItem(null);
    } catch (e) {
      console.error(e);
    }
    setPurchasing(false);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-vibe-neon font-black uppercase tracking-widest text-[10px]">
            <Crown className="w-3 h-3" /> The Sovereignty Exchange
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Marketplace</h2>
          <p className="text-vibe-muted font-mono text-sm max-w-md italic">
            Acquire digital artifacts engineered for maximum resonance.
          </p>
        </div>

        <div className="flex bg-black/40 p-1 rounded-full border border-white/5">
          <button 
            onClick={() => setActiveTab('discover')}
            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-vibe-neon text-black' : 'text-white/40 hover:text-white'}`}
          >
            Discover
          </button>
          <button 
            onClick={() => setActiveTab('my-library')}
            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my-library' ? 'bg-vibe-neon text-black' : 'text-white/40 hover:text-white'}`}
          >
            Vault
          </button>
        </div>
      </div>

      {activeTab === 'discover' ? (
        <>
          {/* Categories */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
             {[
               { id: null, label: 'All Artifacts', icon: <Package /> },
               { id: 'caption_pack', label: 'Caption Packs', icon: <FileText /> },
               { id: 'strategy', label: 'Strategies', icon: <TrendingUp /> },
               { id: 'preset', label: 'Vibe Presets', icon: <Palette /> }
             ].map((cat) => (
               <button
                 key={cat.label}
                 onClick={() => setFilter(cat.id)}
                 className={`flex items-center gap-3 px-6 py-4 rounded-full border whitespace-nowrap transition-all ${
                   filter === cat.id 
                     ? 'bg-vibe-neon/10 border-vibe-neon text-vibe-neon shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                     : 'bg-black/40 border-white/5 text-white/40 hover:border-white/20'
                 }`}
               >
                 {React.cloneElement(cat.icon as React.ReactElement, { className: 'w-4 h-4' })}
                 <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
               </button>
             ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-20">
               <Zap className="w-12 h-12 text-vibe-neon animate-pulse" />
               <span className="text-[10px] font-mono uppercase tracking-[0.4em]">Syncing Marketplace...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {items.map((item) => (
                 <MarketItemCard 
                    key={item.id} 
                    item={item} 
                    onView={() => setSelectedItem(item)}
                    isPurchased={myPurchases.some(p => p.itemId === item.id)}
                 />
               ))}
               
               {items.length === 0 && (
                 <div className="col-span-full py-24 text-center space-y-4">
                    <p className="text-vibe-muted font-mono text-sm uppercase tracking-widest italic">No artifacts manifest in this spectral band.</p>
                 </div>
               )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-white">
             {myPurchases.map((purchase) => {
               const item = items.find(i => i.id === purchase.itemId);
               return item && (
                 <MarketItemCard 
                    key={purchase.id} 
                    item={item} 
                    isPurchased={true}
                    onView={() => setSelectedItem(item)}
                 />
               );
             })}
             
             {myPurchases.length === 0 && (
                <div className="col-span-full py-24 text-center space-y-6">
                   <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto opacity-20 border border-white/10">
                      <ShoppingBag className="w-8 h-8" />
                   </div>
                   <p className="text-vibe-muted font-mono text-sm uppercase tracking-widest italic">Your digital vault is empty.</p>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0 }}
               className="w-full max-w-2xl bg-vibe-card border border-white/10 rounded-[64px] overflow-hidden relative"
             >
                <button onClick={() => setSelectedItem(null)} className="absolute top-10 right-10 p-3 text-vibe-muted hover:text-white">
                   <X className="w-6 h-6" />
                </button>

                <div className="p-12 space-y-10">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-vibe-neon/10 flex items-center justify-center">
                         {selectedItem.type === 'caption_pack' && <FileText className="w-8 h-8 text-vibe-neon" />}
                         {selectedItem.type === 'strategy' && <TrendingUp className="w-8 h-8 text-vibe-neon" />}
                         {selectedItem.type === 'preset' && <Palette className="w-8 h-8 text-vibe-neon" />}
                      </div>
                      <div className="space-y-1">
                         <div className="text-[10px] font-black uppercase text-vibe-neon tracking-widest">{selectedItem.type.replace('_', ' ')}</div>
                         <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">{selectedItem.title}</h3>
                      </div>
                   </div>

                   <p className="text-vibe-muted text-sm leading-relaxed font-mono uppercase tracking-[0.1em]">{selectedItem.description}</p>
                   
                   <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 border-dashed">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Artifact Content Preview</span>
                         <BadgeCheck className="w-4 h-4 text-vibe-neon" />
                      </div>
                      {myPurchases.some(p => p.itemId === selectedItem.id) ? (
                        <div className="space-y-4">
                           <div className="p-4 rounded-2xl bg-vibe-neon/5 border border-vibe-neon/30">
                              <pre className="text-[10px] font-mono text-vibe-neon whitespace-pre-wrap">{selectedItem.content}</pre>
                           </div>
                           <button className="w-full py-4 rounded-full bg-vibe-neon text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                              Download Assets <ShoppingBag className="w-4 h-4" />
                           </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="flex flex-col items-center py-4 gap-2 opacity-40">
                              <Lock className="w-8 h-8" />
                              <span className="text-[8px] font-mono uppercase tracking-widest">Spectral encryption active</span>
                           </div>
                           <div className="flex items-center justify-between pt-6 border-t border-white/5">
                              <div className="text-4xl font-black italic text-vibe-neon">${selectedItem.price.toFixed(2)}</div>
                              <button 
                                onClick={handlePurchase}
                                disabled={purchasing}
                                className="px-10 py-5 rounded-full bg-white text-black font-black uppercase tracking-tight italic hover:scale-105 active:scale-95 transition-all text-sm disabled:opacity-50 flex items-center gap-3"
                              >
                                {purchasing ? <Zap className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Finalize Signal</>}
                              </button>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="flex items-center gap-6 text-[8px] font-mono uppercase tracking-widest text-vibe-muted">
                      <div className="flex items-center gap-2"><Star className="w-3 h-3 fill-vibe-neon text-vibe-neon" /> {selectedItem.rating} Rating</div>
                      <div className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-vibe-neon" /> {selectedItem.salesCount} Manifestations</div>
                      <div className="flex items-center gap-2 ml-auto"><span className="text-vibe-neon">Creator:</span> {selectedItem.sellerName}</div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MarketItemCard: React.FC<{ item: MarketplaceItem; onView: () => void; isPurchased?: boolean }> = ({ item, onView, isPurchased }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="group relative rounded-[48px] overflow-hidden bg-vibe-card border border-white/5 hover:border-vibe-neon/40 transition-all p-1"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-vibe-neon/5 via-transparent to-black pointer-events-none" />
    
    <div className="p-8 space-y-6 relative z-10">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-[20px] bg-white/5 flex items-center justify-center text-vibe-neon">
           {item.type === 'caption_pack' && <FileText className="w-6 h-6" />}
           {item.type === 'strategy' && <TrendingUp className="w-6 h-6" />}
           {item.type === 'preset' && <Palette className="w-6 h-6" />}
        </div>
        {isPurchased ? (
          <div className="px-3 py-1 rounded-full bg-vibe-neon/20 border border-vibe-neon/30 text-[8px] font-black uppercase text-vibe-neon tracking-widest">Owned</div>
        ) : (
          <div className="text-2xl font-black italic text-vibe-neon">${item.price.toFixed(2)}</div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white uppercase tracking-tighter leading-tight line-clamp-1">{item.title}</h3>
        <p className="text-[10px] font-mono text-vibe-muted uppercase tracking-widest truncate">Engineer: {item.sellerName}</p>
      </div>

      <p className="text-[10px] font-sans text-vibe-muted line-clamp-2 leading-relaxed opacity-60">
        {item.description}
      </p>

      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-[8px] font-mono text-vibe-muted uppercase tracking-widest">
           <Star className="w-3 h-3 text-vibe-neon fill-vibe-neon" /> {item.rating}
        </div>
        <button 
          onClick={onView}
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all ${isPurchased ? 'text-vibe-neon' : 'text-white'}`}
        >
          {isPurchased ? 'Open Vault' : 'Acquire'} <ShoppingBag className="w-4 h-4" />
        </button>
      </div>
    </div>
  </motion.div>
);

const Lock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
