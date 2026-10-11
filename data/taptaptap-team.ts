export type TeamRoleKey = "founder" | "web-developer" | "technical";

export type TeamMember = {
  id: string;
  roleKey: TeamRoleKey;
  roleLabel: string;
  name?: string;
  position?: string;
  photo?: string;
  photoClassName?: string;
  photoObjectPosition?: string;
  description?: string;
  email?: string;
  portfolio?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
};

export const taptaptapTeam: TeamMember[] = [
  {
    id: "founder",
    roleKey: "founder",
    roleLabel: "Founder",
    name: "Ervi Jude Siangco Arcillas",
    position: "Founder",
    photo: "/images/team/ervi_jude_arcillas.jpg",
    email: "ervijude.arcillas13xxx@gmail.com",
  },
  {
    id: "web-developer",
    roleKey: "web-developer",
    roleLabel: "Web Developer",
    name: "Khen Joshua Gania Verson",
    position: "Web Developer",
    photo: "/images/team/khen_joshua_verson.png",
    photoClassName: "scale-[1.18]",
    portfolio: "https://khenjoshua.dev/",
  },
  {
    id: "technical",
    roleKey: "technical",
    roleLabel: "Technical",
    name: "Michael Ceasar Cabarse Generalao",
    position: "Technical IT",
    photo: "/images/team/micheal_generalao.jpg",
    photoObjectPosition: "center 34%",
    email: "mgeneralao04@gmail.com",
  },
];
