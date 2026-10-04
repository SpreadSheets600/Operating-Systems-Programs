# Operatring System Lab Classroom Homework

## Program 1 : First Come First Serve (FCFS) Scheduling Algorithm

Write a program to implement First Come First Serve CPU scheduling in C

```c
#include <stdio.h>

int main()
{
    int n = 5;

    int pid[] = {0, 1, 2, 3, 4};
    int bt[] = {2, 6, 4, 9, 12};
    int at[] = {0, 1, 2, 3, 4};

    int ct[5], tat[5], wt[5];

    int total_tat = 0;
    int total_wt = 0;

    // FCFS Scheduling
    for (int i = 0; i < n; i++)
    {

        if (i == 0)
        {
            ct[i] = at[i] + bt[i];
        }
        else
        {
            if (ct[i - 1] < at[i])
                ct[i] = at[i] + bt[i];
            else
                ct[i] = ct[i - 1] + bt[i];
        }

        // Turn Around Time = Completion Time - Arrival Time
        tat[i] = ct[i] - at[i];

        // Waiting Time = Turn Around Time - Burst Time
        wt[i] = tat[i] - bt[i];

        total_tat += tat[i];
        total_wt += wt[i];
    }

    // Display Table
    printf("PID\tAT\tBT\tCT\tTAT\tWT\n");

    for (int i = 0; i < n; i++)
    {
        printf("%d\t%d\t%d\t%d\t%d\t%d\n",
               pid[i], at[i], bt[i],
               ct[i], tat[i], wt[i]);
    }

    printf("\nAverage Turn Around Time = %.2f",
           (float)total_tat / n);

    printf("\nAverage Waiting Time = %.2f\n",
           (float)total_wt / n);

    return 0;
}
```

### Output

```text
PID     AT      BT      CT      TAT     WT
0       0       2       2       2       0
1       1       6       8       7       1
2       2       4       12      10      6
3       3       9       21      18      9
4       4       12      33      29      17

Average Turn Around Time = 13.20
Average Waiting Time = 6.60
```