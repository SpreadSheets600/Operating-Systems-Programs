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
