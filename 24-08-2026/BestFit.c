#include <stdio.h>

int main() {
  int block_size[] = {100, 500, 200, 300, 600};
  int process_size[] = {212, 417, 112, 426};

  int m = sizeof(block_size) / sizeof(block_size[0]);
  int n = sizeof(process_size) / sizeof(process_size[0]);

  int allocation[n];

  // Initialize Unallocated Items As -1
  for (int i = 0; i < n; i++) {
    allocation[i] = -1;
  }

  // Best Fit Memory Allocation
  for (int i = 0; i < n; i++) {
    int best_idx = -1;
    for (int j = 0; j < m; j++) {
      if (block_size[j] >= process_size[i]) {
        if (best_idx == -1 || block_size[j] < block_size[best_idx]) {
          best_idx = j;
        }
      }
    }

    // If A Suitable Block Was Found
    if (best_idx != -1) {
      allocation[i] = best_idx;
      block_size[best_idx] -= process_size[i];
    }
  }

  printf("Process No.\tProcess Size\tBlock No.\n");
  for (int i = 0; i < n; i++) {
    printf("%d\t\t%d\t\t", i + 1, process_size[i]);

    if (allocation[i] != -1) {
      printf("%d\n", allocation[i] + 1);
    } else {
      printf("Not Allocated\n");
    }
  }

  return 0;
}
