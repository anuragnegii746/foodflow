/**
 * DSA: Min-Heap (Priority Queue)
 * Used for: Order dispatch — riders are assigned to the order
 *           with the MINIMUM estimated delivery time first.
 * Time Complexity: insert O(log n), extractMin O(log n), peek O(1)
 * Space Complexity: O(n)
 */

class MinHeap {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.comparator = comparator;
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap[0] || null;
  }

  // Insert element — O(log n)
  insert(element) {
    this.heap.push(element);
    this._bubbleUp(this.heap.length - 1);
    return this;
  }

  // Remove and return minimum element — O(log n)
  extractMin() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  // Heapify from array — O(n)
  buildHeap(arr) {
    this.heap = [...arr];
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this._sinkDown(i);
    }
    return this;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.comparator(this.heap[idx], this.heap[parent]) < 0) {
        [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
        idx = parent;
      } else break;
    }
  }

  _sinkDown(idx) {
    const n = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < n && this.comparator(this.heap[left], this.heap[smallest]) < 0)
        smallest = left;
      if (right < n && this.comparator(this.heap[right], this.heap[smallest]) < 0)
        smallest = right;

      if (smallest !== idx) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else break;
    }
  }

  toArray() {
    return [...this.heap];
  }
}

/**
 * Order Dispatch Queue — wraps MinHeap
 * Orders are prioritized by: urgency level, then estimated delivery time
 */
class OrderDispatchQueue {
  constructor() {
    this.queue = new MinHeap((a, b) => {
      // Priority: VIP orders first, then by estimated delivery time
      if (a.isVIP !== b.isVIP) return a.isVIP ? -1 : 1;
      return a.estimatedDeliveryTime - b.estimatedDeliveryTime;
    });
    this.orderMap = new Map(); // orderId -> queue element (for O(1) lookup)
  }

  enqueue(order) {
    const element = {
      orderId: order.id,
      estimatedDeliveryTime: order.estimatedDeliveryTime || 30,
      isVIP: order.isVIP || false,
      priority: order.isVIP ? 0 : 1,
      order,
      enqueuedAt: Date.now(),
    };
    this.queue.insert(element);
    this.orderMap.set(order.id, element);
    return element;
  }

  dequeue() {
    const element = this.queue.extractMin();
    if (element) this.orderMap.delete(element.orderId);
    return element;
  }

  peek() {
    return this.queue.peek();
  }

  getStats() {
    return {
      queueSize: this.queue.size,
      nextOrder: this.peek(),
      allOrders: this.queue.toArray().map(e => ({
        orderId: e.orderId,
        estimatedDeliveryTime: e.estimatedDeliveryTime,
        isVIP: e.isVIP,
        waitTime: Math.round((Date.now() - e.enqueuedAt) / 1000),
      })),
    };
  }
}

module.exports = { MinHeap, OrderDispatchQueue };
