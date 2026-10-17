import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(import.meta.url);
const J=require('../src/main/resources/web/curriculum.js');
test('all 24 Java examples compile for Java 8 and produce their documented output',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'devflow-java-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 assert.equal(J.lessons.length,24);
 const paths=[];
 for(const l of J.lessons){
  assert.ok(l.question.answer>=0&&l.question.answer<l.question.options.length);
  const path=join(dir,`Lesson${l.number}.java`);paths.push(path);
  await writeFile(path,l.standalone?l.code:`import java.util.*;\nimport java.util.stream.*;\nimport java.io.*;\npublic class Lesson${l.number} { public static void main(String[] args) throws Exception {\n${l.code}\n}}`);
 }
 execFileSync('java',['com.sun.tools.javac.Main','--release','8','-d',dir,...paths],{timeout:60000});
 for(const l of J.lessons){
  const actual=execFileSync('java',['-cp',dir,l.standalone?'Demo':`Lesson${l.number}`],{encoding:'utf8',timeout:10000}).replace(/\r\n/g,'\n').trimEnd();
  assert.equal(actual,l.output,l.title);
  const bytes=await readFile(join(dir,l.standalone?'Demo.class':`Lesson${l.number}.class`));
  assert.equal(bytes.readUInt16BE(6),52,'Java 8 class format');
 }
});
