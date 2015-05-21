import os

def deploy():
    os.system("ssh daniel@homepage './deploy.sh'")

if __name__ == '__main__':
    deploy()
