#include <stdio.h>
#include <pthread.h>

void *fun1(void *arg)
{
    int i;

    for (i = 1; i <= 10; i++)
    {
        printf("%d ", i);
    }

    printf("\n");

    return NULL;
}

int main()
{
    pthread_t tid;
    int j;

    pthread_create(&tid, NULL, fun1, NULL);

    pthread_join(tid, NULL);

    for (j = 20; j <= 30; j++)
    {
        printf("%d ", j);
    }

    printf("\n");

    return 0;
}