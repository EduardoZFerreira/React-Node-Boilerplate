import { Role } from "../config/roles";
import prismaClient from "../prisma/prismaClient";

class RoleService {
  static async verifyRoles() {
    const dbRoles: string[] = [];

    await prismaClient.role
      .findMany({
        select: { title: true },
      })
      .then((dataSet) => {
        dataSet.map((value) => {
          dbRoles.push(value.title);
        });
      });

    const roles = Object.values(Role).filter(
      (value) => isNaN(Number(value)) && !dbRoles.includes(value)
    );

    roles.forEach(async (role) => {
      console.log(`Creating role: ${role}`);
      await prismaClient.role.create({ data: { title: role } });
    });
  }
}

export { RoleService };
