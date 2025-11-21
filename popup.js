const titleEl=document.getElementById('title');const timeEl=document.getElementById('time');
const saveBtn=document.getElementById('save');const refreshBtn=document.getElementById('refresh');
const bookmarksList=document.getElementById('bookmarks-list');const clearAllBtn=document.getElementById('clear-all');
let currentVideoInfo=null;
function formatTime(s){if(s==null)return'—';s=Number(s);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
if(h>0)return`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;return`${m}:${String(sec).padStart(2,'0')}`;}
function renderVideoInfo(info){if(!info||!info.videoId){titleEl.textContent='Not on a YouTube watch page';
timeEl.textContent='—';saveBtn.disabled=true;currentVideoInfo=null;return;}
titleEl.textContent=info.title||'Untitled';timeEl.textContent=`Current: ${formatTime(info.currentTime)}`;
saveBtn.disabled=false;currentVideoInfo=info;}
async function requestVideoInfo(){try{const[tab]=await chrome.tabs.query({active:true,currentWindow:true});
if(!tab){renderVideoInfo(null);return;}chrome.tabs.sendMessage(tab.id,{type:'GET_VIDEO_INFO'},resp=>{
if(chrome.runtime.lastError){renderVideoInfo(null);return;}if(resp&&resp.success){
renderVideoInfo(resp.data);loadBookmarksForVideo(resp.data.videoId);}else renderVideoInfo(null);});}
catch(e){renderVideoInfo(null);}}
function loadBookmarksForVideo(id){if(!id){bookmarksList.innerHTML='';return;}
chrome.storage.local.get(['bookmarks'],res=>{renderBookmarks((res.bookmarks&&res.bookmarks[id])||[]);});}
function renderBookmarks(arr){bookmarksList.innerHTML='';if(!arr.length){bookmarksList.innerHTML='<li>No bookmarks</li>';return;}
arr.forEach((bm,i)=>{const li=document.createElement('li');li.className='bookmark-item';
li.innerHTML=`<span>${formatTime(bm.time)} — ${bm.label||''}</span>`;
const div=document.createElement('div');const j=document.createElement('button');j.textContent='Jump';
j.onclick=()=>jumpToTime(bm.time);const d=document.createElement('button');d.textContent='Delete';
d.onclick=()=>deleteBookmark(i);div.appendChild(j);div.appendChild(d);li.appendChild(div);
bookmarksList.appendChild(li);});}
function saveBookmark(){if(!currentVideoInfo||!currentVideoInfo.videoId)return;
const id=currentVideoInfo.videoId;const t=currentVideoInfo.currentTime||0;
const label=prompt('Optional label for bookmark',formatTime(t));chrome.storage.local.get(['bookmarks'],res=>{
const all=res.bookmarks||{};const arr=all[id]||[];arr.push({time:t,label,createdAt:Date.now()});
all[id]=arr;chrome.storage.local.set({bookmarks:all},()=>loadBookmarksForVideo(id));});}
function deleteBookmark(i){if(!currentVideoInfo)return;const id=currentVideoInfo.videoId;
chrome.storage.local.get(['bookmarks'],res=>{const all=res.bookmarks||{};const arr=all[id]||[];
arr.splice(i,1);all[id]=arr;chrome.storage.local.set({bookmarks:all},()=>loadBookmarksForVideo(id));});}
function clearAll(){if(!currentVideoInfo||!currentVideoInfo.videoId){
if(!confirm('Clear ALL bookmarks?'))return;chrome.storage.local.set({bookmarks:{}},()=>renderBookmarks([]));return;}
const id=currentVideoInfo.videoId;if(!confirm('Clear this video bookmarks?'))return;
chrome.storage.local.get(['bookmarks'],res=>{const all=res.bookmarks||{};all[id]=[];
chrome.storage.local.set({bookmarks:all},()=>loadBookmarksForVideo(id));});}
function jumpToTime(t){chrome.tabs.query({active:true,currentWindow:true},tabs=>{
const tab=tabs[0];chrome.tabs.sendMessage(tab.id,{type:'JUMP_TO_TIME',time:t},resp=>{
if(chrome.runtime.lastError)alert('Cannot contact page');});});}
saveBtn.onclick=saveBookmark;refreshBtn.onclick=requestVideoInfo;clearAllBtn.onclick=clearAll;requestVideoInfo();
