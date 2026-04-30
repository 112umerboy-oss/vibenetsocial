import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  Hash, 
  TrendingUp, 
  Flame, 
  BarChart3, 
  Fingerprint, 
  ShieldAlert, 
  EyeOff, 
  Skull, 
  Zap, 
  Loader2, 
  X, 
  Video, 
  Bookmark,
  ChevronRight,
  Anchor,
  ShoppingBag,
  Shield,
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  generateCaption, 
  generateBio, 
  getHashtagStrategy, 
  getTrendRadar, 
  getAestheticScore, 
  getCreatorInsights, 
  getVibeDNA, 
  detectCringe, 
  getRealityCheck, 
  usePostGraveyard,
  generateHook,
  generateDM
} from '../services/vibeNetService';
import { proService } from '../services/proService';
import { marketplaceService } from '../services/marketplaceService';
import { insuranceService } from '../services/insuranceService';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

type Feature = 
  | 'caption' | 'bio' | 'hashtags' | 'trends' 
  | 'aesthetic' | 'insights' | 'dna' | 'cringe' 
  | 'reality' | 'graveyard' | 'hook' | 'daily' | 'dm' | 'insurance';

export const CreatorLab: React.FC<{
  onShowVault: () => void;
  onSaveToVault: (feature: string, content: string) => void;
}> = ({ onShowVault, onSaveToVault }) => {
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const [input, setInput] = useState('');
  const [style, setStyle] = useState('raw');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [remainingEnergy, setRemainingEnergy] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [insurancePosts, setInsurancePosts] = useState<any[]>([]);
  const [insuranceEmails, setInsuranceEmails] = useState<string[]>([]);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    return onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      setUserProfile(snap.data() as UserProfile);
    });
  }, []);

  const handleAction = async (forcedInput?: string) => {
    const currentInput = forcedInput || input;
    if (!currentInput && !['daily'].includes(activeFeature || '') && !selectedFile) return;
    
    if (!auth.currentUser) return;

    setLoading(true);
    setResponse(null);
    try {
      const usageCheck = await proService.checkAndIncrementAiUsage(auth.currentUser.uid);
      if (!usageCheck.allowed) {
        setResponse(usageCheck.error || "Energy depleted.");
        setLoading(false);
        return;
      }
      
      if (usageCheck.remaining !== undefined) {
        setRemainingEnergy(usageCheck.remaining);
      }

      let result = '';
      const mediaContext = selectedFile ? ` [Media Context: ${selectedFile.name} (${selectedFile.type})]` : '';
      const finalInput = currentInput + mediaContext;

      switch (activeFeature) {
        case 'caption': result = await generateCaption(finalInput, style) || ''; break;
        case 'bio': result = await generateBio(currentInput, style) || ''; break;
        case 'hashtags': result = await getHashtagStrategy(currentInput) || ''; break;
        case 'trends': result = await getTrendRadar(currentInput) || ''; break;
        case 'aesthetic': result = await getAestheticScore(currentInput) || ''; break;
        case 'insights': result = await getCreatorInsights(currentInput) || ''; break;
        case 'dna': result = await getVibeDNA(currentInput) || ''; break;
        case 'cringe': result = await detectCringe(currentInput) || ''; break;
        case 'reality': result = await getRealityCheck(currentInput) || ''; break;
        case 'graveyard': result = await usePostGraveyard(currentInput) || ''; break;
        case 'hook': result = await generateHook(currentInput) || ''; break;
        case 'dm': result = await generateDM(currentInput) || ''; break;
        case 'daily': result = await generateCaption('generate a creative CHALLENGE mission for THE DAILY DROP today', 'raw') || ''; break;
      }
      setResponse(result);
    } catch (error) {
      setResponse("vibe check failed. try again in a bit.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (response && activeFeature) {
      onSaveToVault(activeFeature, response);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const resetLab = () => {
    setActiveFeature(null);
    setInput('');
    setResponse(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (!input) setInput(`Analyzing media: ${file.name}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      <div className="flex-1 space-y-8">
        <div className="flex justify-between items-center border-b border-vibe-border pb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black italic text-vibe-neon uppercase tracking-tighter">Creator Lab</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-vibe-muted">AI-Augmented Content Engineering</p>
              {remainingEnergy !== null && (
                <div className="px-2 py-0.5 rounded bg-vibe-neon/10 border border-vibe-neon/20 text-[8px] font-black uppercase text-vibe-neon animate-pulse">
                  Signal Energy: {remainingEnergy}/10
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onShowVault}
              className="p-2 border border-vibe-border text-vibe-muted hover:text-vibe-neon transition-colors"
              title="Vault"
            >
              <Bookmark className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setActiveFeature('daily'); handleAction(); }}
              className="p-2 border border-vibe-neon text-vibe-neon hover:bg-vibe-neon hover:text-black transition-all"
              title="Daily Drop"
            >
              <Zap className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!activeFeature ? (
            <motion.div 
              key="lab-grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              <FeatureCard id="caption" title="Caption Gen" icon={<Sparkles />} onClick={() => setActiveFeature('caption')} />
              <FeatureCard id="hook" title="Hook Gen" icon={<Anchor />} onClick={() => setActiveFeature('hook')} />
              <FeatureCard id="dm" title="DM Opener" icon={<MessageSquare />} onClick={() => setActiveFeature('dm')} />
              <FeatureCard id="bio" title="Bio Gen" icon={<Fingerprint />} onClick={() => setActiveFeature('bio')} />
              <FeatureCard id="hashtags" title="Hashtasgs" icon={<Hash />} onClick={() => setActiveFeature('hashtags')} />
              <FeatureCard id="trends" title="Trend Radar" icon={<TrendingUp />} onClick={() => setActiveFeature('trends')} />
              <FeatureCard id="aesthetic" title="Vibe Audit" icon={<Flame />} onClick={() => setActiveFeature('aesthetic')} />
              <FeatureCard id="insights" title="Insights" icon={<BarChart3 />} onClick={() => setActiveFeature('insights')} />
              <FeatureCard id="dna" title="Vibe DNA" icon={<Fingerprint />} onClick={() => setActiveFeature('dna')} />
              <FeatureCard id="cringe" title="Cringe Monitor" icon={<ShieldAlert />} onClick={() => setActiveFeature('cringe')} />
              <FeatureCard id="reality" title="Reality Check" icon={<EyeOff />} onClick={() => setActiveFeature('reality')} />
              <FeatureCard id="graveyard" title="Graveyard" icon={<Skull />} onClick={() => setActiveFeature('graveyard')} />
              <FeatureCard id="insurance" title="Insurance" icon={<Shield />} onClick={() => setActiveFeature('insurance')} />
            </motion.div>
          ) : (
            <motion.div 
              key="lab-active"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button onClick={resetLab} className="text-vibe-muted hover:text-vibe-neon transition-colors font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <X className="w-3 h-3" /> Back to Lab
              </button>
              
              <div className="bg-vibe-card border border-vibe-border p-8">
                <h3 className="text-2xl font-black uppercase italic text-vibe-neon mb-6">
                  {activeFeature.toUpperCase().replace('_', ' ')}
                </h3>
                <div className="space-y-4">
                  {activeFeature === 'insurance' ? (
                    <div className="space-y-8">
                       <div className="p-6 rounded-2xl bg-vibe-neon/5 border border-vibe-neon/20 space-y-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-full bg-vibe-neon/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-vibe-neon" />
                             </div>
                             <div>
                                <h4 className="text-lg font-black uppercase tracking-tight text-white italic">Content Insurance 🛡️</h4>
                                <p className="text-[10px] font-mono uppercase text-vibe-muted">Universal Sovereignty Protocol</p>
                             </div>
                          </div>
                          <p className="text-sm font-sans text-vibe-muted leading-relaxed">
                             Protect your digital lineage. If you are banned on legacy platforms (IG/TikTok), VibeNet exports your audience email list, migrates your top-performing artifacts, and broadcasts a welcome signal to your followers.
                          </p>
                       </div>

                       {!userProfile?.hasInsurance ? (
                          <div className="p-8 border border-white/5 bg-black/40 rounded-[32px] text-center space-y-6">
                             <div className="space-y-2">
                                <div className="text-4xl font-black italic text-white">$1<span className="text-sm text-vibe-muted">/mo</span></div>
                                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-vibe-neon">Indisputable Sovereignty</p>
                             </div>
                             <button 
                               onClick={async () => {
                                 setLoading(true);
                                 try {
                                   await insuranceService.purchaseInsurance();
                                   alert('Insurance Active. Sovereign Status Confirmed.');
                                 } catch (e) { console.error(e); }
                                 setLoading(false);
                               }}
                               disabled={loading}
                               className="w-full py-4 rounded-full bg-white text-black font-black uppercase tracking-widest italic hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                             >
                               {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Initiate Protection"}
                             </button>
                          </div>
                       ) : (
                          <div className="space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 border border-vibe-neon/30 bg-vibe-neon/5 rounded-2xl">
                                   <div className="text-[8px] font-black uppercase tracking-widest text-vibe-neon mb-1">Status</div>
                                   <div className="text-xl font-bold text-white uppercase italic">{userProfile.insuranceStatus}</div>
                                </div>
                                <div className="p-6 border border-white/10 bg-white/5 rounded-2xl">
                                   <div className="text-[8px] font-black uppercase tracking-widest text-vibe-muted mb-1">Next Signal</div>
                                   <div className="text-xl font-bold text-white uppercase italic">
                                      {userProfile.insuranceRenewalDate?.toDate ? userProfile.insuranceRenewalDate.toDate().toLocaleDateString() : 'Active'}
                                   </div>
                                </div>
                             </div>

                             {userProfile.insuranceStatus === 'active' && (
                                <div className="p-8 border border-red-500/30 bg-red-500/5 rounded-[40px] space-y-6">
                                   <div className="flex items-center gap-3 text-red-500">
                                      <AlertTriangle className="w-6 h-6" />
                                      <h5 className="text-sm font-black uppercase tracking-widest">Protocol Red Alert</h5>
                                   </div>
                                   <p className="text-[10px] font-sans text-vibe-muted uppercase leading-relaxed">
                                      ONLY ACTIVATE IF YOUR EXTERNAL CHANNELS HAVE BEEN COMPROMISED OR BANNED. THIS WILL TRIGGER MIGRATION AND BROADCAST.
                                   </p>
                                   <button 
                                     onClick={async () => {
                                       if(confirm('MANIFEST RECOVERY PROTOCOL? This is irreversible.')) {
                                         setLoading(true);
                                         try {
                                           const { posts, emailList } = await insuranceService.claimInsurance();
                                           setInsurancePosts(posts);
                                           setInsuranceEmails(emailList);
                                           alert('Sovereignty Protocol Manifested. Download your artifacts below.');
                                         } catch (e) { alert('Claim failed.'); }
                                         setLoading(false);
                                       }
                                     }}
                                     disabled={loading}
                                     className="w-full py-4 rounded-full border border-red-500/50 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                   >
                                     {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Deploy Recovery Protocol"}
                                   </button>
                                </div>
                             )}

                             {insuranceEmails.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                   <div className="flex items-center justify-between">
                                      <h6 className="text-[10px] font-black uppercase tracking-widest text-vibe-neon">Recovered Lineage</h6>
                                      <div className="px-2 py-1 bg-vibe-neon/10 rounded text-[8px] font-black text-vibe-neon">{insuranceEmails.length} Emails Recovered</div>
                                   </div>
                                   <div className="p-6 border border-white/10 bg-black/60 rounded-2xl space-y-2">
                                      {insuranceEmails.map(email => (
                                         <div key={email} className="flex items-center justify-between text-[10px] font-mono text-vibe-muted">
                                            <span>{email}</span>
                                            <Download className="w-3 h-3 hover:text-vibe-neon cursor-pointer" />
                                         </div>
                                      ))}
                                   </div>
                                   <button className="w-full py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                      Export Artifact List (.csv) <Download className="w-4 h-4" />
                                   </button>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                  ) : (
                    <>
                      {(activeFeature === 'caption' || activeFeature === 'hook') && (
                    <div 
                      className="w-full h-48 border-2 border-dashed border-vibe-border flex flex-col items-center justify-center cursor-pointer hover:border-vibe-neon transition-colors overflow-hidden relative bg-vibe-pure/40 group mb-4"
                      onClick={() => document.getElementById('labMediaInput')?.click()}
                    >
                      {previewUrl ? (
                        selectedFile?.type.startsWith('video') ? (
                          <video src={previewUrl} className="w-full h-full object-cover opacity-50" autoPlay muted loop />
                        ) : (
                          <img src={previewUrl} className="w-full h-full object-cover opacity-50" alt="Preview" />
                        )
                      ) : (
                        <div className="text-center group-hover:scale-110 transition-transform">
                          <Video className="w-8 h-8 text-vibe-muted mx-auto mb-2" />
                          <p className="text-[10px] uppercase font-black tracking-widest text-vibe-muted">Drop media for context</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="labMediaInput"
                        onChange={handleFileChange} 
                        accept="image/*,video/*" 
                        className="hidden" 
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 mb-2">
                    {['raw', 'editorial', 'chaotic', 'whimsical'].map((s) => (
                      <button 
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 border transition-all ${style === s ? 'bg-white text-black border-white' : 'border-vibe-border text-vibe-muted hover:border-vibe-neon'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <textarea 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Insert prompt or context string..."
                    className="w-full bg-vibe-pure/30 border border-vibe-border p-4 text-sm font-mono focus:outline-none focus:border-vibe-neon min-h-[120px] placeholder:opacity-30 text-vibe-contrast"
                  />
                  <button 
                    onClick={() => handleAction()}
                    disabled={loading || (!input && !selectedFile)}
                    className="w-full h-12 bg-vibe-neon text-black font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-vibe-contrast hover:text-vibe-pure transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Generate Output
                  </button>

                  {response && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 space-y-4"
                    >
                      <div className="p-6 bg-vibe-pure border border-vibe-border text-vibe-gray font-mono text-sm whitespace-pre-wrap leading-relaxed border-l-vibe-neon border-l-4">
                        {response}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSave}
                          className={`flex-1 h-10 border text-[10px] font-black uppercase transition-all ${justSaved ? 'bg-vibe-neon text-black border-vibe-neon' : 'border-vibe-border text-vibe-muted hover:text-vibe-neon'}`}
                        >
                          {justSaved ? 'Archived' : 'Archive'}
                        </button>
                        <button 
                          onClick={() => {
                            const price = prompt('Set entry price for this artifact ($):', '4.99');
                            if (price) {
                              marketplaceService.listItem({
                                title: `${activeFeature.toUpperCase()} Artifact`,
                                description: `High-resonance ${activeFeature} engineered in the Lab.`,
                                price: parseFloat(price),
                                type: activeFeature === 'preset' ? 'preset' : activeFeature === 'trends' ? 'strategy' : 'caption_pack',
                                content: response
                              }).then(() => alert('Artifact Manifested in Marketplace.'));
                            }
                          }}
                          className="px-4 h-10 border border-vibe-border text-vibe-muted hover:border-vibe-neon hover:text-vibe-neon transition-all"
                          title="List on Marketplace"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full lg:w-72 space-y-6">
        <div className="bg-vibe-card border border-vibe-border p-6 space-y-6">
          <div className="flex items-center gap-2 text-vibe-neon">
            <TrendingUp className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">Network Pulse</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-vibe-pure/40 border-l-2 border-vibe-neon">
              <p className="text-[10px] font-mono text-vibe-muted uppercase tracking-tighter">Current Meta</p>
              <p className="text-xs font-black text-vibe-contrast italic">#BrutalistTech</p>
              <div className="w-full h-1 bg-vibe-border mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '78%' }}
                  className="h-full bg-vibe-neon"
                />
              </div>
            </div>

            <div className="p-3 bg-vibe-pure/40 border-l-2 border-blue-500">
              <p className="text-[10px] font-mono text-vibe-muted uppercase tracking-tighter">Active Frequency</p>
              <p className="text-xs font-black text-vibe-contrast italic">Synthetic Surrealism</p>
              <div className="w-full h-1 bg-vibe-border mt-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '45%' }}
                  className="h-full bg-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-vibe-border">
              <h4 className="text-[8px] font-mono uppercase text-vibe-muted mb-3 tracking-widest">Recent Extractions</h4>
              <div className="space-y-2">
                {[
                  { name: 'AestheticAudit', time: '2m' },
                  { name: 'CaptionEngine', time: '5m' },
                  { name: 'CringeScan', time: '12m' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-vibe-muted">Agent_{item.name}</span>
                    <span className="text-vibe-neon opacity-50">{item.time} ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-vibe-neon/5 border border-vibe-neon/20 group hover:border-vibe-neon transition-all cursor-help">
          <div className="flex items-center gap-2 text-vibe-neon mb-2">
            <Zap className="w-3 h-3 fill-current" />
            <span className="text-[9px] font-black uppercase">Lab Pro Tip</span>
          </div>
          <p className="text-[10px] text-vibe-muted italic leading-relaxed group-hover:text-vibe-contrast transition-colors">
            "Combining Viral Hook with Aesthetic Audit increases resonance by 40%."
          </p>
        </div>
      </div>
    </div>
  );
};

function FeatureCard({ id, title, icon, onClick }: { id: string, title: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -4, borderColor: '#CCFF00' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-6 border border-vibe-border bg-vibe-card flex flex-col gap-4 aspect-square transition-all group relative overflow-hidden"
    >
      <div className="w-10 h-10 border border-vibe-neon flex items-center justify-center text-vibe-neon group-hover:bg-vibe-neon group-hover:text-black transition-all">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-left text-vibe-contrast">{title}</div>
      <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-vibe-neon" />
    </motion.button>
  );
}
