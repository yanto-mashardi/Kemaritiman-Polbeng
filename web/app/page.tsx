"use client";

import { useEffect, useState } from "react";
import "./public.css";

type PublicData={
  programs:Array<{id:string;name:string;level:string}>;
  documents:Array<{id:number;title:string;type:string;unitId:string;year:number;url:string}>;
  repositories:Array<{id:number;title:string;author:string;year:number;type:string;programId:string;url:string}>;
  laboratories:Array<{id:number;name:string;field:string}>;
  lecturers:Array<{id:number;nidn:string;name:string;programId:string;expertise?:string;scholarUrl?:string;photoUrl?:string}>;
  quality:Array<{id:number;title:string;unitId:string;stage:string;status:string;year:number}>;
};

const empty:PublicData={programs:[],documents:[],repositories:[],laboratories:[],lecturers:[],quality:[]};

function SectionTitle({eyebrow,title,copy}:{eyebrow:string;title:string;copy?:string}){
  return <div className="section-title"><span>{eyebrow}</span><h2>{title}</h2>{copy&&<p>{copy}</p>}</div>;
}

export default function PublicHome(){
  const [data,setData]=useState<PublicData>(empty);
  const [status,setStatus]=useState("Memuat informasi resmi…");
  useEffect(()=>{void fetch("/api/public",{cache:"no-store"}).then(async r=>{const json=await r.json();if(!r.ok)throw new Error(json.error);setData(json);setStatus("Informasi diperbarui dari basis data resmi")}).catch(e=>setStatus(e instanceof Error?e.message:"Data belum tersedia"))},[]);
  const nautika=data.lecturers.filter(x=>x.programId==="NAUTIKA");
  const kpn=data.lecturers.filter(x=>x.programId==="KPN");
  return <div className="public-site">
    <header className="public-header">
      <a className="public-brand" href="#beranda"><img src="/api/logo" alt="Logo Politeknik Negeri Bengkalis"/><span><b>Jurusan Kemaritiman</b><small>Politeknik Negeri Bengkalis</small></span></a>
      <nav><a href="#profil">Profil</a><a href="#prodi">Program Studi</a><a href="#akademik">Akademik</a><a href="#laboratorium">Laboratorium</a><a href="#riset">Riset</a><a href="#mutu">Mutu</a></nav>
      <a className="workspace-link" href="/workspace">Portal Internal</a>
    </header>

    <main>
      <section className="public-hero" id="beranda">
        <div className="hero-copy"><span className="hero-kicker">PENDIDIKAN VOKASI KEMARITIMAN</span><h1>Mempersiapkan sumber daya maritim profesional melalui pembelajaran terapan.</h1><p>Jurusan Kemaritiman Politeknik Negeri Bengkalis mengelola pendidikan, laboratorium bersama, pengembangan kompetensi, riset terapan, dan penjaminan mutu pada bidang pelayaran serta kepelabuhanan.</p><div className="hero-actions"><a href="#prodi">Jelajahi program studi</a><a className="ghost" href="#laboratorium">Lihat fasilitas</a></div></div>
        <div className="hero-art" aria-hidden="true"><div className="compass"><i/><span>N</span></div><div className="wave one"/><div className="wave two"/><div className="route"><i/><i/><i/></div></div>
      </section>

      <section className="public-strip" aria-label="Status data"><span>PORTAL AKADEMIK JURUSAN</span><p>{status}</p><a href="/workspace">Masuk sebagai pengelola →</a></section>

      <section className="public-section intro" id="profil">
        <SectionTitle eyebrow="PROFIL JURUSAN" title="UPPS Kemaritiman" copy="Jurusan menjadi unit pengelola program studi yang menjaga kesinambungan strategi, sumber daya bersama, tata kelola akademik, dan mutu pendidikan."/>
        <div className="intro-grid"><article><b>01</b><h3>Pendidikan vokasi</h3><p>Pembelajaran dirancang berbasis kompetensi dan praktik profesi kemaritiman.</p></article><article><b>02</b><h3>Laboratorium bersama</h3><p>Fasilitas jurusan digunakan lintas program studi untuk praktik, simulasi, dan riset.</p></article><article><b>03</b><h3>Penjaminan mutu</h3><p>Capaian program studi dievaluasi melalui siklus PPEPP dengan evidence yang dapat diaudit.</p></article></div>
      </section>

      <section className="public-section programs" id="prodi">
        <SectionTitle eyebrow="PROGRAM STUDI" title="Dua jalur pendidikan kemaritiman" copy="Informasi publik berfokus pada profil akademik. Proses evaluasi OBE dan KPI dikelola melalui portal internal sesuai role."/>
        <div className="program-cards">
          <article className="program-card nautika"><span>D3 · NAUTIKA</span><h3>D3 Nautika</h3><p>Pendidikan vokasi bidang navigasi, keselamatan pelayaran, pengoperasian kapal, dan kompetensi profesi perwira deck.</p><div><small>Dosen terdaftar</small><strong>{nautika.length||"—"}</strong></div><a href="#akademik">Lihat akademik →</a></article>
          <article className="program-card kpn"><span>D3 · KPN</span><h3>D3 Ketatalaksanaan Pelayaran Niaga</h3><p>Pendidikan vokasi bidang operasional pelabuhan, bisnis pelayaran, bongkar muat, logistik, dan tata kelola angkutan laut.</p><div><small>Dosen terdaftar</small><strong>{kpn.length||"—"}</strong></div><a href="#akademik">Lihat akademik →</a></article>
        </div>
      </section>

      <section className="public-section academic" id="akademik">
        <div><SectionTitle eyebrow="AKADEMIK" title="Dokumen dan sumber akademik resmi" copy="Hanya dokumen yang ditetapkan berstatus publik yang ditampilkan pada website ini."/><div className="document-list">{data.documents.slice(0,6).map(d=><a key={d.id} href={d.url||"#"}><span>{d.type}</span><div><b>{d.title}</b><small>{d.unitId} · {d.year}</small></div><i>↗</i></a>)}{!data.documents.length&&<p className="empty-public">Belum ada dokumen publik yang dipublikasikan dari basis data.</p>}</div></div>
        <aside className="academic-note"><span>KURIKULUM & OBE</span><h3>Evaluasi pembelajaran berada di ruang kerja internal.</h3><p>Hasil CPL/CPMK, evidence, temuan mutu, dan tindak lanjut tidak ditampilkan sebagai data publik sebelum melalui proses evaluasi dan persetujuan.</p><a href="/workspace">Portal pengelola →</a></aside>
      </section>

      <section className="public-section" id="laboratorium">
        <SectionTitle eyebrow="LABORATORIUM & FASILITAS" title="Infrastruktur praktik dan riset" copy="Laboratorium dikelola pada tingkat Jurusan dan digunakan sesuai kebutuhan kedua program studi."/>
        <div className="lab-public-grid">{data.laboratories.map((lab,i)=><article key={lab.id}><div className="lab-number">0{i+1}</div><span>LABORATORIUM</span><h3>{lab.name}</h3><p>{lab.field}</p></article>)}{!data.laboratories.length&&<p className="empty-public">Data laboratorium belum tersedia.</p>}</div>
      </section>

      <section className="public-section research" id="riset">
        <SectionTitle eyebrow="RISET & KARYA AKADEMIK" title="Luaran pengetahuan kemaritiman" copy="Repositori menampilkan karya yang telah didaftarkan untuk akses publik."/>
        <div className="research-grid">{data.repositories.slice(0,6).map(r=><article key={r.id}><span>{r.type} · {r.year}</span><h3>{r.title}</h3><p>{r.author}</p><a href={r.url||"#"}>Buka karya →</a></article>)}{!data.repositories.length&&<p className="empty-public">Belum ada karya publik pada repositori.</p>}</div>
      </section>

      <section className="public-section quality" id="mutu">
        <div><SectionTitle eyebrow="MUTU & AKREDITASI" title="Transparansi mutu yang terkendali" copy="Website menampilkan informasi mutu yang telah melewati proses persetujuan. Data operasional, temuan evaluasi, dan evidence tetap berada pada workspace internal."/><div className="quality-public-list">{data.quality.map(q=><div key={q.id}><span>{q.year}</span><b>{q.title}</b><small>{q.unitId} · {q.status}</small></div>)}{!data.quality.length&&<p className="empty-public">Belum ada ringkasan mutu yang ditetapkan untuk publikasi.</p>}</div></div>
        <aside className="ppepp-public"><span>SIKLUS PENJAMINAN MUTU</span>{["Penetapan","Pelaksanaan","Evaluasi","Pengendalian","Peningkatan"].map((x,i)=><div key={x}><i>{i+1}</i><b>{x}</b></div>)}</aside>
      </section>
    </main>

    <footer className="public-footer"><div><img src="/api/logo" alt=""/><span><b>Jurusan Kemaritiman</b><small>Politeknik Negeri Bengkalis</small></span></div><p>Website informasi akademik dan kelembagaan Jurusan Kemaritiman.</p><a href="/workspace">Portal Internal</a></footer>
  </div>;
}
