#include <stdio.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
  pid_t pid;

  pid = fork();

  if (pid < 0) {
    printf("Process failed\n");
  } else if (pid == 0) {
    sleep(4);

    printf("I am child process\n");
    printf("My PID = %d, My Parent PID = %d\n", getpid(), getppid());
  } else {
    printf("I am parent process\n");
    printf("My PID = %d, My Child PID = %d\n", getpid(), pid);
  }

  return 0;
}
