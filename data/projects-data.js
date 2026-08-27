/**
 * Saajvan Design Studio — Portfolio Projects Registry & Helper Architecture
 * Automatically builds structured project objects from folder assets.
 */

(function () {
  // Raw project folder manifests
  const RAW_PROJECTS = [
    {
      folder: "cleo county -Noida",
      category: "Residential",
      shortDesc: "Luxury contemporary residential design featuring bespoke millwork, curated lighting, and warm architectural textures.",
      files: [
        "coverhall.jpg",
        "coverhall2.jpg",
        "coverhall3.jpg",
        "coverhall4.jpg",
        "coverhall5.jpg",
        "YKS--32.jpg",
        "YKS--34.jpg",
        "YKS--35.jpg",
        "YKS--36.jpg",
        "YKS--40.jpg",
        "YKS--41.jpg",
        "YKS--44.jpg",
        "YKS--52.jpg",
        "YKS--53.jpg",
        "YKS--54.jpg",
        "YKS--55.jpg",
        "YKS--57.jpg",
        "YKS--58.jpg",
        "YKS--61.jpg",
        "YKS--63.jpg",
        "YKS--64.jpg",
        "YKS--65.jpg",
        "YKS--66.jpg",
        "YKS--67.jpg"
      ]
    },
    {
      folder: "Deluxe Bedroom",
      category: "Residential",
      shortDesc: "An intimate master suite blending custom upholstered wall elements, ambient perimeter illumination, and rich wood tones.",
      files: [
        "coverbedroom.jpg",
        "coverbedroom2.jpg",
        "coverbedroom3.jpg",
        "YKS--11.jpg",
        "YKS--14.jpg",
        "YKS--17.jpg",
        "YKS--2.jpg",
        "YKS--20.jpg",
        "YKS--25.jpg",
        "YKS--26.jpg",
        "YKS--29.jpg",
        "YKS--4.jpg",
        "YKS--5.jpg",
        "YKS--6.jpg",
        "YKS--9.jpg",
        "YKS-.jpg"
      ]
    },
    {
      folder: "Dwarka IDFL office",
      category: "Commercial",
      shortDesc: "Modern corporate office space designed for agile collaboration, seamless client presentation, and high-performance workflow.",
      files: [
        "cover.jpg",
        "cover2.jpg",
        "20260611_232345.jpg",
        "20260611_233922.jpg",
        "20260611_232248.mp4",
        "20260611_232308.mp4",
        "20260611_232350.mp4",
        "20260611_232408.mp4",
        "20260611_232600.mp4",
        "20260611_232629.mp4",
        "20260611_232744.mp4",
        "20260611_233116.mp4",
        "20260611_233144.mp4",
        "20260611_233201.mp4",
        "20260611_233222.mp4",
        "20260611_233420.mp4",
        "20260611_233450.mp4",
        "20260611_233702.mp4",
        "20260611_233720.mp4",
        "20260611_233813.mp4",
        "20260611_233839.mp4",
        "20260611_233928.mp4",
        "20260611_234337.mp4",
        "20260611_234416.mp4",
        "20260611_234438.mp4",
        "20260611_234505.mp4",
        "20260611_234554.mp4"
      ]
    },
    {
      folder: "Omaxe noida",
      category: "Commercial",
      shortDesc: "Sophisticated interior architecture harmonizing sleek architectural forms, custom materials, and refined modern aesthetics.",
      files: [
        "cover.jpg",
        "cover0.jpg",
        "cover11.jpg",
        "IMG-20220930-WA0000.jpg",
        "IMG-20220930-WA0001.jpg",
        "IMG-20220930-WA0003.jpg",
        "IMG-20220930-WA0005.jpg",
        "IMG-20220930-WA0007.jpg",
        "jeeKj3nsgIF_hVMlr3Ucv18zalD0-vEAFNfqrNNPQ8Q=_plaintext_638134479970797931.jpg",
        "JN8BoVpwE2XLuLCPomYh18sn1dbioCXC3SD83hT-Hnw=_plaintext_638134479970797931.jpg",
        "SHq1GxyXc1p70E_ynDLrFtf6loUayjNwk8ex3wAqHUo=_plaintext_638134479970797931.jpg",
        "VID-20220930-WA0009.jpg",
        "BJ1yjmdeD95M-p1Wqad9ElXN0gGdvCTF9pvVrnTO4is=_plaintext_638134479938505480.mp4",
        "sV9RUXvEH4sxdQukMGkxeh9k0ANqq2r-r8ZoOqFoLAg=_plaintext_638134479830881965.mp4",
        "UILhX3NnlGM6zjKVc9q-7GXU0F8TFJZvfq4rwC7Cos0=_plaintext_638134479970787939.mp4",
        "wdAAqSqyARPNS0RM_ps1-Picdr9at8vXdWsNZbsB2_I=_plaintext_638134479970787939.mp4",
        "Y0aBU0qNuWXt1fakxOJI75j8lHTV107E7dYwc1-buJQ=_plaintext_638134479970787939.mp4"
      ]
    }
  ];

  // Helper functions
  function isVideo(filename) {
    return /\.(mp4|webm|mov|m4v)$/i.test(filename);
  }

  function isCover(filename) {
    return /^cover/i.test(filename);
  }

  // Convert folder name to clean readable title
  function formatFolderToTitle(folder) {
    if (!folder) return "";
    // Handle specific punctuation / separator formatting
    let clean = folder.replace(/\s*-\s*/g, " – ");
    return clean
      .split(" ")
      .map(word => {
        if (!word) return "";
        if (word === "–" || word === "-") return "–";
        // Preserve common uppercase acronyms like IDFL, NCR, 3D
        if (/^(IDFL|NCR|3D|UI|UX|HQ)$/i.test(word)) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  // Convert folder name to slug
  function generateSlug(folder) {
    return folder
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Normalize single project
  function buildProject(raw) {
    const folder = raw.folder;
    const name = raw.title || formatFolderToTitle(folder);
    const slug = raw.slug || generateSlug(folder);
    const category = raw.category || "Residential";
    const shortDesc = raw.shortDesc || "";
    const rawFiles = raw.files || [];

    // Filter unique valid assets
    const uniqueFiles = Array.from(
      new Set(
        rawFiles.filter(f =>
          /\.(jpg|jpeg|png|webp|avif|mp4|webm|mov|m4v)$/i.test(f)
        )
      )
    );

    // Filter covers vs other media
    const coverFiles = uniqueFiles.filter(f => isCover(f));
    const otherFiles = uniqueFiles.filter(f => !isCover(f));

    // Effective covers for 4s card slideshow
    const effectiveCovers =
      coverFiles.length > 0
        ? coverFiles
        : uniqueFiles.length > 0
        ? [uniqueFiles[0]]
        : [];

    // Complete media for detail page (covers first, then remaining assets)
    const allMediaFiles = [...coverFiles, ...otherFiles];

    const covers = effectiveCovers.map(filename => ({
      filename,
      url: `assets/projects/${encodeURIComponent(folder)}/${encodeURIComponent(
        filename
      )}`,
      type: isVideo(filename) ? "video" : "image"
    }));

    const media = allMediaFiles.map(filename => ({
      filename,
      url: `assets/projects/${encodeURIComponent(folder)}/${encodeURIComponent(
        filename
      )}`,
      type: isVideo(filename) ? "video" : "image",
      isCover: isCover(filename)
    }));

    return {
      folder,
      name,
      title: name, // alias
      slug,
      id: slug,    // alias
      category,
      shortDesc,
      covers,
      media
    };
  }

  const PROCESSED_PROJECTS = RAW_PROJECTS.map(buildProject);

  // Global registry and lookup utilities
  window.SAAJVAN_PROJECTS_DATA = PROCESSED_PROJECTS;

  window.getSaajvanProjects = function () {
    return PROCESSED_PROJECTS;
  };

  window.getSaajvanProjectBySlug = function (slugOrId) {
    if (!slugOrId) return null;
    const clean = String(slugOrId).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return (
      PROCESSED_PROJECTS.find(
        p => p.slug === clean || generateSlug(p.folder) === clean
      ) || null
    );
  };
})();
