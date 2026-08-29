# Contiguous Memory Allocation Algorithms (First Fit, Best Fit, Worst Fit)

## Program 1: First Fit Memory Allocation

To write a C program that implements the First Fit memory allocation strategy. Each process is allocated to the **first** memory block that is large enough to hold it.

```c
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

  // Firstfit Memory Allocation
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
      if (block_size[j] >= process_size[i]) {
        allocation[i] = j;
        block_size[j] -= process_size[i];

        break;
      }
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
}
```

### Output

```text
Process No.     Process Size    Block No.
1               212             2
2               417             5
3               112             2
4               426             Not Allocated
```

## Program 2: Best Fit Memory Allocation

To write a C program that implements the Best Fit memory allocation strategy. Each process is allocated to the **smallest** memory block that is large enough to hold it, minimizing wasted space.

```c
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
```

### Output

```text
Process No.     Process Size    Block No.
1               212             4
2               417             2
3               112             3
4               426             5
```

## Program 3: Worst Fit Memory Allocation

To write a C program that implements the Worst Fit memory allocation strategy. Each process is allocated to the **largest** available memory block. The blocks are sorted in descending order using bubble sort, and the first (largest) block is used for each allocation.

```c
#include <stdio.h>

int main() {
  int block_size[] = {100, 500, 200, 300, 600};
  int process_size[] = {212, 417, 112, 426};

  int m = sizeof(block_size) / sizeof(block_size[0]);
  int n = sizeof(process_size) / sizeof(process_size[0]);

  int allocation[n];
  int block_id[m];

  for (int i = 0; i < m; i++) {
    block_id[i] = i + 1;
  }

  for (int i = 0; i < n; i++) {
    allocation[i] = -1;
  }

  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m - 1; j++) {
      for (int k = 0; k < m - j - 1; k++) {
        if (block_size[k] < block_size[k + 1]) {

          int temp_size = block_size[k];
          block_size[k] = block_size[k + 1];
          block_size[k + 1] = temp_size;

          int temp_id = block_id[k];
          block_id[k] = block_id[k + 1];
          block_id[k + 1] = temp_id;
        }
      }
    }

    if (block_size[0] >= process_size[i]) {
      allocation[i] = block_id[0];
      block_size[0] -= process_size[i];
    }
  }

  printf("Process No.\tProcess Size\tBlock No.\n");
  for (int i = 0; i < n; i++) {
    printf("%d\t\t%d\t\t", i + 1, process_size[i]);

    if (allocation[i] != -1) {
      printf("%d\n", allocation[i]);
    } else {
      printf("Not Allocated\n");
    }
  }

  return 0;
}
```

### Output

```text
Process No.     Process Size    Block No.
1               212             5
2               417             2
3               112             5
4               426             Not Allocated
```
