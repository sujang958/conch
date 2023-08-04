export const parseCookie = (cookies: string | null | undefined) =>
  !cookies
    ? {}
    : Object.fromEntries(
        cookies
          .replace(/ /gi, "")
          .split(";")
          .map((cookie) =>
            cookie.split("=").map((value) => decodeURIComponent(value.trim())),
          ),
      )
