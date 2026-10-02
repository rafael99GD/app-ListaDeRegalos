/**
 * Genera una permutación donde ningún elemento permanece en su posición original (Desbarajuste / Derangement).
 * Implementa el algoritmo de Sattolo para generar un ciclo hamiltoniano completo sin puntos fijos en O(N).
 *
 * @param items Array de elementos a desordenar
 * @returns Nuevo array con los elementos reasignados tal que result[i] !== items[i]
 */
export function generateDerangement<T>(items: T[]): T[] {
  if (!items || items.length < 2) {
    throw new Error('Se requieren al menos 2 participantes para realizar el sorteo');
  }

  const result = [...items];
  const n = result.length;

  // Algoritmo de Sattolo: permuta seleccionando j estrictamente menor que i (0 <= j < i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  // Verificación de seguridad matemática adicional contra puntos fijos
  for (let i = 0; i < n; i++) {
    if (result[i] === items[i]) {
      // Reintento de seguridad ante cualquier anomalía
      return generateDerangement(items);
    }
  }

  return result;
}
