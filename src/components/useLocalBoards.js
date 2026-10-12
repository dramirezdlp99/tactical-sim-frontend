import { useState, useEffect, useCallback } from 'react';
import { saveLocalBoard, getLocalBoards, deleteLocalBoard } from './offlineBoards';

/**
 * useLocalBoards
 * Encapsula la lógica del Modo Campo (IndexedDB) que antes estaba
 * duplicada, casi idéntica, dentro de TacticalSimulator y TennisSimulator:
 * listar, guardar, cargar y borrar pizarras locales de un deporte.
 *
 * Guardar en: tactical-sim-frontend/src/components/useLocalBoards.js
 */
export function useLocalBoards(sport, { getPositions, getNote, onLoadBoard }) {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(''); // '', 'saving', 'saved', 'error'

  const refresh = useCallback(async () => {
    try {
      setList(await getLocalBoards(sport));
    } catch (err) {
      // IndexedDB no disponible: el Modo Campo local no se ofrece, el resto sigue igual.
    }
  }, [sport]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = async () => {
    setStatus('saving');
    try {
      await saveLocalBoard({ sport, name, positions: getPositions(), note: getNote() });
      setName('');
      setStatus('saved');
      await refresh();
    } catch (err) {
      setStatus('error');
    }
  };

  const remove = async (id) => {
    try {
      await deleteLocalBoard(id);
      await refresh();
    } catch (err) {
      // si falla el borrado, la pizarra simplemente sigue en la lista
    }
  };

  return { list, name, setName, status, save, remove, onLoad: onLoadBoard };
}
