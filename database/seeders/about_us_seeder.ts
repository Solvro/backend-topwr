import { BaseSeeder } from "@adonisjs/lucid/seeders";

import { LinkType } from "#enums/link_type";
import AboutUsGeneral from "#models/about_us_general";
import AboutUsGeneralLink from "#models/about_us_general_link";
import FilesService from "#services/files_service";

export default class extends BaseSeeder {
  static environment = ["development", "testing", "production"];

  async run() {
    await this.seedAboutUs();
    await this.seedSolvroSocialLinks();
  }

  private async seedAboutUs() {
    const description = `<p dir="ltr"><strong>Witamy na pokładzie ToPWR!</strong></p>
      <p dir="ltr">Jesteśmy zespołem student&oacute;w z <a href="https://solvro.pwr.edu.pl/" target="_blank" rel="noopener">KN Solvro</a>&nbsp;- informatycznego koła naukowego działającego na Politechnice Wrocławskiej. Z pasją tworzymy innowacyjne rozwiązania przez student&oacute;w, dla student&oacute;w. Prace nad <a href="https://github.com/Solvro/mobile-topwr" target="_blank" rel="noopener">#ToPWR</a>&nbsp;rozpoczęliśmy w grudniu 2023 roku, starając się, żeby aplikacja była funkcjonalna, intuicyjna i przyjazna dla Was.</p>
      <p dir="ltr">Cieszymy się, że możesz korzystać z efekt&oacute;w naszej pracy. Mamy nadzieję, że ToPWR stanie się Twoim towarzyszem na naszej uczelni, pomagając Ci w nauce, organizacji i czerpaniu pełnymi garściami z życia studenckiego. Dziękujemy 🧡</p>
      <p dir="ltr">Masz pomysł, jak możemy stać się lepsi? Chętnie usłyszymy Twoje sugestie! Błędy w aplikacji zgłoś za pomocą <a href="https://topwr.solvro.pl/navigation" target="_blank" rel="noopener">formularza</a>. W innych kwestiach, wyślij wiadomość pod <a href="mailto:kn.solvro@pwr.edu.pl" target="_blank" rel="noopener">kn.solvro@pwr.edu.pl</a>.</p>
      <p dir="ltr">Rzuć okiem na <a href="https://solvro.pwr.edu.pl/portfolio/" target="_blank" rel="noopener">resztę naszych projekt&oacute;w</a>.</p>
      <p>Jeżeli to, co robimy, do Ciebie przemawia, zapraszamy w nasze szeregi! Informacje o trwających rekrutacjach znajdziesz na naszych mediach społecznościowych poniżej.</p>`;

    const filesService = new FilesService();
    const result = await filesService.uploadLocalFile(
      "./assets/topwr_cover.png",
    );

    const coverPhotoKey = result;

    await AboutUsGeneral.create({
      description,
      coverPhotoKey,
    });
  }

  private async seedSolvroSocialLinks() {
    await AboutUsGeneralLink.createMany([
      {
        linkType: LinkType.Default,
        link: "https://solvro.pwr.edu.pl",
      },
      {
        linkType: LinkType.GitHub,
        link: "https://github.com/Solvro",
      },
      {
        linkType: LinkType.Facebook,
        link: "https://www.facebook.com/knsolvro",
      },
      {
        linkType: LinkType.LinkedIn,
        link: "https://www.linkedin.com/company/knsolvro/",
      },
      {
        linkType: LinkType.Mail,
        link: "mailto:kn.solvro@pwr.edu.pl",
      },
    ]);
  }
}
