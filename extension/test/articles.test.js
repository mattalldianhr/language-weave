import { test } from 'node:test';
import assert from 'node:assert/strict';
import { article, joinArticle, capLike, deAdjEnding } from '../src/shared/articles.js';

test('Spanish articles', () => {
  assert.equal(article('es', { definite: 'def', gender: 'f', number: 'sg', next: 'pregunta' }), 'la');
  assert.equal(article('es', { definite: 'def', gender: 'm', number: 'pl', next: 'tiempos' }), 'los');
  assert.equal(article('es', { definite: 'indef', gender: 'f', number: 'pl', next: 'gentes' }), 'unas');
  assert.equal(article('es', { definite: 'def', gender: 'f', number: 'sg', next: 'agua' }), 'el');
});

test('French articles elide before a vowel or mute h, not aspirated h', () => {
  assert.equal(joinArticle('fr', 'le', 'homme'), "l'homme");
  assert.equal(joinArticle('fr', 'la', 'idée'), "l'idée");
  assert.equal(joinArticle('fr', 'le', 'hasard'), 'le hasard');
  assert.equal(joinArticle('fr', 'les', 'idées'), 'les idées');
  assert.equal(article('fr', { definite: 'indef', gender: 'f', number: 'sg', next: 'idée' }), 'une');
  assert.equal(article('fr', { definite: 'indef', gender: 'm', number: 'pl', next: 'temps' }), 'des');
});

test('German articles by case; no indefinite plural', () => {
  assert.equal(article('de', { definite: 'def', gender: 'm', number: 'sg', case: 'nom' }), 'der');
  assert.equal(article('de', { definite: 'def', gender: 'm', number: 'sg', case: 'acc' }), 'den');
  assert.equal(article('de', { definite: 'def', gender: 'n', number: 'sg', case: 'dat' }), 'dem');
  assert.equal(article('de', { definite: 'def', gender: 'f', number: 'pl', case: 'gen' }), 'der');
  assert.equal(article('de', { definite: 'indef', gender: 'm', number: 'sg', case: 'acc' }), 'einen');
  assert.equal(article('de', { definite: 'indef', gender: 'f', number: 'sg', case: 'dat' }), 'einer');
  assert.equal(article('de', { definite: 'indef', gender: 'f', number: 'pl', case: 'nom' }), null);
});

test('Italian articles follow the next word', () => {
  assert.equal(article('it', { definite: 'def', gender: 'm', number: 'sg', next: 'tempo' }), 'il');
  assert.equal(article('it', { definite: 'def', gender: 'm', number: 'sg', next: 'studente' }), 'lo');
  assert.equal(article('it', { definite: 'def', gender: 'm', number: 'sg', next: 'zio' }), 'lo');
  assert.equal(joinArticle('it', article('it', { definite: 'def', gender: 'm', number: 'sg', next: 'amico' }), 'amico'), "l'amico");
  assert.equal(article('it', { definite: 'def', gender: 'm', number: 'pl', next: 'amici' }), 'gli');
  assert.equal(article('it', { definite: 'def', gender: 'm', number: 'pl', next: 'tempi' }), 'i');
  assert.equal(article('it', { definite: 'def', gender: 'f', number: 'pl', next: 'idee' }), 'le');
  assert.equal(article('it', { definite: 'indef', gender: 'm', number: 'sg', next: 'studente' }), 'uno');
  assert.equal(joinArticle('it', article('it', { definite: 'indef', gender: 'f', number: 'sg', next: 'idea' }), 'idea'), "un'idea");
  assert.equal(article('it', { definite: 'indef', gender: 'f', number: 'pl', next: 'idee' }), null);
});

test('Portuguese articles', () => {
  assert.equal(article('pt', { definite: 'def', gender: 'm', number: 'sg', next: 'tempo' }), 'o');
  assert.equal(article('pt', { definite: 'def', gender: 'f', number: 'pl', next: 'pessoas' }), 'as');
  assert.equal(article('pt', { definite: 'indef', gender: 'm', number: 'pl', next: 'tempos' }), 'uns');
});

test('capLike copies the English initial capital', () => {
  assert.equal(capLike('The', 'la'), 'La');
  assert.equal(capLike('the', 'la'), 'la');
  assert.equal(capLike('BUT', 'pero'), 'Pero');
});

test('German adjective endings after definite and indefinite articles', () => {
  assert.equal(deAdjEnding({ article: 'def', gender: 'm', number: 'sg', case: 'nom' }), 'e');
  assert.equal(deAdjEnding({ article: 'def', gender: 'm', number: 'sg', case: 'acc' }), 'en');
  assert.equal(deAdjEnding({ article: 'def', gender: 'f', number: 'pl', case: 'nom' }), 'en');
  assert.equal(deAdjEnding({ article: 'indef', gender: 'm', number: 'sg', case: 'nom' }), 'er');
  assert.equal(deAdjEnding({ article: 'indef', gender: 'n', number: 'sg', case: 'acc' }), 'es');
  assert.equal(deAdjEnding({ article: 'indef', gender: 'f', number: 'sg', case: 'dat' }), 'en');
});
