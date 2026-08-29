// Route du formulaire à compléter juste après l'inscription (redirection unique).
export function onboardingRoute(role) {
  switch (role) {
    case "EDUCATOR":
      return "/dashboard/profil";
    case "SCHOOL":
      return "/dashboard/etablissement";
    case "PARENT":
      return "/dashboard/eleves";
    case "ADULT_LEARNER":
      return "/dashboard/parametres";
    default:
      return "/dashboard";
  }
}
