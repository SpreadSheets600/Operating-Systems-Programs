# Installation Of CentOS 7 In VirtualBox

## Aim

To install and configure CentOS 7 Linux on a virtual machine using Oracle VM VirtualBox.

## Introduction

A virtual machine is a software-based computer that allows an operating system to run inside another operating system. Oracle VM VirtualBox is virtualization software used to create and manage virtual machines. In this experiment, CentOS 7 Linux is installed on a virtual machine with the required hardware, storage, and network configurations.

## Install VirtualBox And Configure Virtual Machine

1. Install Oracle VM VirtualBox and open it.
2. Create a new virtual machine.
3. Set the operating system type as Linux and version as Red Hat (64-bit).
4. Allocate the required memory and create a virtual hard disk.
5. Open Settings → General → Advanced and set:
   - Shared Clipboard: Bidirectional
   - Drag and Drop: Bidirectional
6. Open Settings → Storage. Under Controller: IDE, attach the CentOS 7 ISO file.
7. Open Settings → Network and set Attached to: Bridged Adapter.

## Install CentOS 7 on Virtual Machine

1. Start the virtual machine and boot from the CentOS 7 ISO.
2. Select Install CentOS 7.
3. In Software Selection, choose:
   - Server with GUI
   - Java
   - FTP Server
   - File and Storage Server
4. Disable Kdump.
5. Disable the Security Policy.
6. In Installation Destination, select the local storage disk.
7. Choose Automatically configure partitioning.
8. Click Begin Installation.
9. Set the root password and create a user account.
10. After installation is completed, reboot the virtual machine.

## Result

CentOS 7 Linux was successfully installed and configured on Oracle VM VirtualBox with the required storage, network, and software settings.
